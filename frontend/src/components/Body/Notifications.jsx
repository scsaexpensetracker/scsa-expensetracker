import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  AlertCircle,
  CheckCircle,
  Mail,
  MailOpen,
  AlertTriangle,
  Info
} from 'lucide-react';
import axios from 'axios';
import './Notifications.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Notifications = ({ user, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    LRN: '',
    type: '',
    priority: '',
    isRead: '',
    school_year: ''
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? `${API_URL}/notifications/notifs` 
        : `${API_URL}/notifications/student/${user.LRN}`;
      const response = await axios.get(url);
      setNotifications(response.data);
      setFilteredNotifications(response.data);
      
      // Notify parent component about notification update (for navbar badge)
      if (onNotificationUpdate && !isAdmin) {
        const unreadCount = response.data.filter(n => !n.isRead).length;
        onNotificationUpdate(unreadCount);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    if (filters.LRN && isAdmin) {
      filtered = filtered.filter(n => {
        const lrnValue = n.LRN?.LRN || n.LRN;
        return lrnValue?.toLowerCase().includes(filters.LRN.toLowerCase());
      });
    }

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    if (filters.isRead !== '') {
      const isReadValue = filters.isRead === 'true';
      filtered = filtered.filter(n => n.isRead === isReadValue);
    }

    if (filters.school_year) {
      filtered = filtered.filter(n => n.school_year === filters.school_year);
    }

    setFilteredNotifications(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      LRN: '',
      type: '',
      priority: '',
      isRead: '',
      school_year: ''
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_URL}/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (err) {
      setError('Failed to mark as read');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/notifications/mark-all-read/${user.LRN}`);
      setSuccess('All notifications marked as read');
      await fetchNotifications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to mark all as read');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return <AlertTriangle size={18} className="notif-icon-high" />;
      case 'Medium': return <Info size={18} className="notif-icon-medium" />;
      case 'Low': return <Info size={18} className="notif-icon-low" />;
      default: return <Info size={18} />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'notif-priority-high';
      case 'Medium': return 'notif-priority-medium';
      case 'Low': return 'notif-priority-low';
      default: return '';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <div className="notif-wrapper">
      <div className="notif-container">
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-content">
            <div className="notif-header-text">
              <h1>
                <Bell size={32} />
                Notifications
              </h1>
              <p>View and manage notifications and announcements</p>
            </div>
            {!isAdmin && unreadCount > 0 && (
              <div className="notif-header-actions">
                <button className="notif-mark-all-btn" onClick={handleMarkAllAsRead}>
                  <CheckCircle size={20} />
                  Mark All as Read ({unreadCount})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="notif-alert notif-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="notif-alert notif-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="notif-filters-card">
          <div className="notif-filters-header">
            <h2>
              <Filter size={20} />
              Filter Notifications
            </h2>
            <button className="notif-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="notif-filters-grid">
            {isAdmin && (
              <div className="notif-filter-group">
                <label>
                  <Search size={16} />
                  Search by LRN
                </label>
                <input
                  type="text"
                  name="LRN"
                  value={filters.LRN}
                  onChange={handleFilterChange}
                  placeholder="Enter LRN"
                />
              </div>
            )}

            <div className="notif-filter-group">
              <label>Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="Payment Reminder">Payment Reminder</option>
                <option value="Due Date">Due Date</option>
                <option value="Balance Alert">Balance Alert</option>
                <option value="General Announcement">General Announcement</option>
                <option value="Event Reminder">Event Reminder</option>
              </select>
            </div>

            <div className="notif-filter-group">
              <label>Priority</label>
              <select name="priority" value={filters.priority} onChange={handleFilterChange}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="notif-filter-group">
              <label>Status</label>
              <select name="isRead" value={filters.isRead} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            <div className="notif-filter-group">
              <label>School Year</label>
              <input
                type="text"
                name="school_year"
                value={filters.school_year}
                onChange={handleFilterChange}
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="notif-card">
          <div className="notif-list-header">
            <h2>
              Notifications List
              <span className="notif-count">
                ({filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="notif-loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notif-no-data">
              <Bell size={48} />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="notif-list">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notif-item ${!notification.isRead ? 'notif-unread' : ''}`}
                >
                  <div className="notif-item-icon">
                    {notification.isRead ? <MailOpen size={24} /> : <Mail size={24} />}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-header">
                      <div className="notif-item-title-row">
                        <h3>{notification.title}</h3>
                        <div className="notif-item-badges">
                          <span className={`notif-priority ${getPriorityClass(notification.priority)}`}>
                            {getPriorityIcon(notification.priority)}
                            {notification.priority}
                          </span>
                          <span className="notif-type">{notification.type}</span>
                        </div>
                      </div>
                      {isAdmin && notification.LRN && (
                        <div className="notif-item-student">
                          <strong>Student:</strong>{' '}
                          {notification.LRN.firstname} {notification.LRN.middlename} {notification.LRN.lastname}{' '}
                          ({notification.LRN.LRN || notification.LRN})
                        </div>
                      )}
                    </div>
                    <p className="notif-item-message">{notification.message}</p>
                    <div className="notif-item-footer">
                      <span className="notif-item-date">{formatDate(notification.createdAt)}</span>
                      <span className="notif-item-module">{notification.related_module}</span>
                      <span className="notif-item-year">{notification.school_year}</span>
                    </div>
                  </div>
                  {!notification.isRead && !isAdmin && (
                    <div className="notif-item-actions">
                      <button
                        className="notif-action-btn notif-action-btn-read"
                        onClick={() => handleMarkAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;