import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import './Events.css';

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    LRN: '',
    status: '',
    event_type: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [formData, setFormData] = useState({
    LRN: '',
    event_name: '',
    event_type: '',
    amount_required: '',
    amount_paid: '',
    due_date: '',
    event_date: '',
    description: '',
    status: 'Unpaid'
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? 'http://localhost:5000/events' 
        : `http://localhost:5000/events/student/${user.LRN}`;
      const response = await axios.get(url);
      setEvents(response.data);
      setFilteredEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.LRN && isAdmin) {
      filtered = filtered.filter(e => 
        (e.LRN?.LRN || e.LRN)?.toLowerCase().includes(filters.LRN.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.event_type) {
      filtered = filtered.filter(e => e.event_type === filters.event_type);
    }

    setFilteredEvents(filtered);
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
      status: '',
      event_type: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNew = () => {
    setCurrentEvent(null);
    setFormData({
      LRN: '',
      event_name: '',
      event_type: '',
      amount_required: '',
      amount_paid: '',
      due_date: '',
      event_date: '',
      description: '',
      status: 'Unpaid'
    });
    setShowModal(true);
  };

  const handleEdit = (event) => {
    setCurrentEvent(event);
    setFormData({
      LRN: event.LRN?.LRN || event.LRN,
      event_name: event.event_name,
      event_type: event.event_type,
      amount_required: event.amount_required,
      amount_paid: event.amount_paid,
      due_date: event.due_date.split('T')[0],
      event_date: event.event_date.split('T')[0],
      description: event.description || '',
      status: event.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentEvent) {
        await axios.put(`http://localhost:5000/events/${currentEvent._id}`, formData);
        setSuccess('Event updated successfully');
      } else {
        await axios.post('http://localhost:5000/events', formData);
        setSuccess('Event created successfully');
      }
      fetchEvents();
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/events/${eventToDelete._id}`);
      setSuccess('Event deleted successfully');
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete event');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'events-status-paid';
      case 'Partially Paid': return 'events-status-partial';
      case 'Unpaid': return 'events-status-unpaid';
      case 'Overdue': return 'events-status-overdue';
      default: return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="events-wrapper">
      <div className="events-container">
        {/* Header */}
        <div className="events-header">
          <div className="events-header-content">
            <div className="events-header-text">
              <h1>
                <Calendar size={32} />
                Events & Contributions
              </h1>
              <p>Track school events and contribution payments</p>
            </div>
            {isAdmin && (
              <button className="events-add-btn" onClick={handleAddNew}>
                <Plus size={20} />
                Add Event
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="events-alert events-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="events-alert events-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="events-filters-card">
          <div className="events-filters-header">
            <h2>
              <Filter size={20} />
              Filter Events
            </h2>
            <button className="events-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="events-filters-grid">
            {isAdmin && (
              <div className="events-filter-group">
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

            <div className="events-filter-group">
              <label>Event Type</label>
              <select name="event_type" value={filters.event_type} onChange={handleFilterChange}>
                <option value="">All Event Types</option>
                <option value="Foundation Day">Foundation Day</option>
                <option value="Field Trip">Field Trip</option>
                <option value="Sports Fest">Sports Fest</option>
                <option value="Christmas Party">Christmas Party</option>
                <option value="Graduation">Graduation</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="events-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="events-card">
          <div className="events-list-header">
            <h2>
              Events List
              <span className="events-count">
                ({filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="events-loading">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="events-no-data">
              <Calendar size={48} />
              <p>No events found</p>
            </div>
          ) : (
            <div className="events-table-container">
              <table className="events-table">
                <thead>
                  <tr>
                    {isAdmin && <th>LRN</th>}
                    {isAdmin && <th>Student Name</th>}
                    <th>Event Name</th>
                    <th>Event Type</th>
                    <th>Amount Required</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Event Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event._id}>
                      {isAdmin && <td>{event.LRN?.LRN || event.LRN}</td>}
                      {isAdmin && (
                        <td>
                          {event.LRN?.firstname} {event.LRN?.middlename} {event.LRN?.lastname}
                        </td>
                      )}
                      <td>{event.event_name}</td>
                      <td>{event.event_type}</td>
                      <td>{formatCurrency(event.amount_required)}</td>
                      <td>{formatCurrency(event.amount_paid)}</td>
                      <td className="events-balance">{formatCurrency(event.balance)}</td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>{formatDate(event.due_date)}</td>
                      <td>
                        <span className={`events-status ${getStatusClass(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>
                        {isAdmin && (
                          <div className="events-action-buttons">
                            <button
                              className="events-action-btn events-action-btn-edit"
                              onClick={() => handleEdit(event)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="events-action-btn events-action-btn-delete"
                              onClick={() => handleDeleteClick(event)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {!isAdmin && event.description && (
                          <span className="events-view-details">View Details</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="events-modal-overlay">
            <div className="events-modal">
              <div className="events-modal-header">
                <h3>{currentEvent ? 'Edit Event' : 'Add Event'}</h3>
                <button className="events-modal-close" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="events-modal-body">
                  <div className="events-form-group">
                    <label>LRN *</label>
                    <input
                      type="text"
                      name="LRN"
                      value={formData.LRN}
                      onChange={handleInputChange}
                      required
                      disabled={currentEvent}
                    />
                  </div>

                  <div className="events-form-group">
                    <label>Event Name *</label>
                    <input
                      type="text"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="events-form-group">
                    <label>Event Type *</label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Event Type</option>
                      <option value="Foundation Day">Foundation Day</option>
                      <option value="Field Trip">Field Trip</option>
                      <option value="Sports Fest">Sports Fest</option>
                      <option value="Christmas Party">Christmas Party</option>
                      <option value="Graduation">Graduation</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="events-form-row">
                    <div className="events-form-group">
                      <label>Amount Required *</label>
                      <input
                        type="number"
                        name="amount_required"
                        value={formData.amount_required}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="events-form-group">
                      <label>Amount Paid</label>
                      <input
                        type="number"
                        name="amount_paid"
                        value={formData.amount_paid}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="events-form-row">
                    <div className="events-form-group">
                      <label>Event Date *</label>
                      <input
                        type="date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="events-form-group">
                      <label>Due Date *</label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="events-form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  <div className="events-form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="events-modal-actions">
                  <button
                    type="button"
                    className="events-modal-btn events-modal-btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="events-modal-btn events-modal-btn-save">
                    {currentEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="events-modal-overlay">
            <div className="events-modal">
              <div className="events-modal-header">
                <h3>Confirm Delete</h3>
                <button className="events-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="events-modal-body">
                <p>Are you sure you want to delete this event?</p>
                <p className="events-modal-warning">This action cannot be undone.</p>
              </div>
              <div className="events-modal-actions">
                <button
                  className="events-modal-btn events-modal-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="events-modal-btn events-modal-btn-delete"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;