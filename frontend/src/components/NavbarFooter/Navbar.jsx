import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import axios from 'axios';
import './Navbar.css';
import SCSA_LOGO from '../SCSA/SCSA_Logo.jpg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Navbar = ({ user, onLogout, unreadCount, onNotificationUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch unread count for students
  useEffect(() => {
    if (user && user.LRN && user.role !== 'admin') {
      fetchUnreadCount();
      
      // Refresh unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count/${user.LRN}`);
      if (onNotificationUpdate) {
        onNotificationUpdate(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fullName = user 
    ? `${user.firstname || ''} ${user.middlename || ''} ${user.lastname || ''}`.trim()
    : 'Guest';

  const navLinks = user && user.role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/admin-dashboard' },
        { name: 'Tuition Fees', path: '/tuition-fees' },
        { name: 'Events', path: '/events' },
        { name: 'Uniforms & Books', path: '/uniforms-books' },
        { name: 'Payment History', path: '/payment-history' },
        { name: 'Notifications', path: '/notifications' },
      ]
    : user 
      ? [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Tuition Fees', path: '/tuition-fees' },
          { name: 'Events', path: '/events' },
          { name: 'Uniforms & Books', path: '/uniforms-books' },
          { name: 'Payment History', path: '/payment-history' },
          { name: 'Notifications', path: '/notifications', badge: unreadCount },
        ]
      : [];

  return (
    <nav className="navbar-wrapper">
      {/* Top Bar with Date, Time and User Info */}
      <div className="navbar-top-bar">
        <div className="navbar-container">
          <div className="navbar-datetime">
            <span className="navbar-date">{formatDate(currentTime)}</span>
            <span className="navbar-time">{formatTime(currentTime)}</span>
          </div>
          <div className="navbar-user-info">
            <User size={18} />
            <span>Hello, <strong>{fullName}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            {/* Logo and Title */}
            <div className="navbar-logo">
              <img src={SCSA_LOGO} alt="SCSA Logo" className="navbar-logo-image" />
              <div className="navbar-title">
                <h1>St. Catherine of Siena Academy of Samal, Inc.</h1>
                <p className="navbar-subtitle">Samal, Bataan - Financial Management Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="navbar-links-desktop">
              {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className="navbar-link-wrapper">
                  {link.name}
                  {link.badge > 0 && (
                    <span className="navbar-notification-badge">{link.badge}</span>
                  )}
                </Link>
              ))}
              {user && (
                <button onClick={onLogout} className="navbar-logout-btn">
                  Logout
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="navbar-menu-button"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="navbar-mobile">
            <div className="navbar-mobile-content">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="navbar-mobile-link-wrapper"
                >
                  {link.name}
                  {link.badge > 0 && (
                    <span className="navbar-notification-badge">{link.badge}</span>
                  )}
                </Link>
              ))}
              {user && (
                <button onClick={onLogout} className="navbar-logout-btn-mobile">
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;