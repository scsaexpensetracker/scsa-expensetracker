import React, { useState, useEffect } from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Phone, 
  MapPin,
  Mail,
  Edit,
  Lock,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StudentDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [formData, setFormData] = useState({
    firstname: user.firstname || '',
    middlename: user.middlename || '',
    lastname: user.lastname || '',
    address: user.address || '',
    contactnumber: user.contactnumber || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync localUser with user prop
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditProfile = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setError('');
    setSuccess('');
    setFormData({
      firstname: localUser.firstname || '',
      middlename: localUser.middlename || '',
      lastname: localUser.lastname || '',
      address: localUser.address || '',
      contactnumber: localUser.contactnumber || '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password confirmation
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length if provided
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const updateData = {};
      Object.keys(formData).forEach((key) => {
        if (key !== 'confirmPassword' && formData[key]) {
          updateData[key] = formData[key];
        }
      });

      const response = await fetch(`${API_URL}/auth/profile/${localUser.LRN}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update both local and parent state
      setLocalUser(data.user);
      if (setUser) {
        setUser({ ...data.user });
      }

      setSuccess(data.message);
      setTimeout(() => handleModalClose(), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="student-dashboard-wrapper">
      <div className="student-dashboard-container">
        {/* Welcome Banner */}
        <div className="student-welcome-banner">
          <div className="student-welcome-content">
            <div className="student-welcome-text">
              <h1>Welcome back, {localUser.firstname}!</h1>
              <p>{formatDate(currentTime)}</p>
            </div>
            <div className="student-welcome-icon">
              <GraduationCap size={48} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="student-stats-grid">
          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-primary">
              <BookOpen size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">Grade Level</p>
              <p className="student-stat-value">{localUser.gradelevel}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-success">
              <GraduationCap size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">Section</p>
              <p className="student-stat-value">{localUser.section}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-warning">
              <BookOpen size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">Strand</p>
              <p className="student-stat-value">{localUser.strand}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-info">
              <Calendar size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">School Year</p>
              <p className="student-stat-value">{localUser.school_year}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="student-content-grid">
          {/* Student Information Card */}
          <div className="student-info-card">
            <div className="student-card-header">
              <h2>
                <User size={20} />
                Personal Information
              </h2>
              <button className="student-edit-btn" onClick={handleEditProfile}>
                <Edit size={16} />
                Edit Profile
              </button>
            </div>
            <div className="student-card-body">
              <div className="student-info-grid">
                <div className="student-info-item">
                  <label>Learner Reference Number</label>
                  <p>{localUser.LRN}</p>
                </div>
                <div className="student-info-item">
                  <label>Full Name</label>
                  <p>{localUser.firstname} {localUser.middlename} {localUser.lastname}</p>
                </div>
                <div className="student-info-item">
                  <label>Address</label>
                  <p>
                    <MapPin size={14} className="student-info-icon" />
                    {localUser.address}
                  </p>
                </div>
                <div className="student-info-item">
                  <label>Contact Number</label>
                  <p>
                    <Phone size={14} className="student-info-icon" />
                    {localUser.contactnumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information Card */}
          <div className="student-academic-card">
            <div className="student-card-header">
              <h2>
                <GraduationCap size={20} />
                Academic Information
              </h2>
            </div>
            <div className="student-card-body">
              <div className="student-academic-details">
                <div className="student-academic-item">
                  <div className="student-academic-label">Grade Level</div>
                  <div className="student-academic-value">{localUser.gradelevel}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">Section</div>
                  <div className="student-academic-value">{localUser.section}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">Strand</div>
                  <div className="student-academic-value">{localUser.strand}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">School Year</div>
                  <div className="student-academic-value">{localUser.school_year}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="student-quick-links-card">
            <div className="student-card-header">
              <h2>Quick Access</h2>
            </div>
            <div className="student-card-body">
              <div className="student-quick-links">
                <button 
                  className="student-quick-link-btn student-quick-link-primary"
                  onClick={() => navigate('/tuition-fees')}
                >
                  <BookOpen size={20} />
                  View Tuition Fees
                </button>
                <button 
                  className="student-quick-link-btn student-quick-link-success"
                  onClick={() => navigate('/events')}
                >
                  <Calendar size={20} />
                  Event Contributions
                </button>
                <button 
                  className="student-quick-link-btn student-quick-link-warning"
                  onClick={() => navigate('/uniforms-books')}
                >
                  <BookOpen size={20} />
                  Uniforms & Books
                </button>
                <button 
                  className="student-quick-link-btn student-quick-link-info"
                  onClick={() => navigate('/notifications')}
                >
                  <Mail size={20} />
                  Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Financial Overview Card */}
          <div className="student-financial-overview">
            <div className="student-card-header">
              <h2>Financial Overview</h2>
            </div>
            <div className="student-card-body">
              <div className="student-financial-message">
                <div className="student-financial-icon">
                  <BookOpen size={32} />
                </div>
                <p>
                  View your complete financial information including tuition fees, 
                  event contributions, and payment history through the navigation menu above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>
                  <User size={20} />
                  Edit Profile
                </h2>
                <button className="modal-close-btn" onClick={handleModalClose}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="edit-profile-form">
                  {error && <p className="error-message">{error}</p>}
                  {success && <p className="success-message">{success}</p>}
                  <div className="form-group">
                    <label htmlFor="firstname">
                      <User size={14} /> First Name
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="middlename">
                      <User size={14} /> Middle Name
                    </label>
                    <input
                      type="text"
                      id="middlename"
                      name="middlename"
                      value={formData.middlename}
                      onChange={handleChange}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastname">
                      <User size={14} /> Last Name
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">
                      <MapPin size={14} /> Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contactnumber">
                      <Phone size={14} /> Contact Number
                    </label>
                    <input
                      type="text"
                      id="contactnumber"
                      name="contactnumber"
                      value={formData.contactnumber}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">
                      <Lock size={14} /> New Password (leave blank to keep unchanged)
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      <Lock size={14} /> Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={handleModalClose}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;