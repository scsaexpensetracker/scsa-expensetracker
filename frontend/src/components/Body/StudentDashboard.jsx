import React, { useState, useEffect } from 'react';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Phone, 
  MapPin,
  Mail,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="student-dashboard-wrapper">
      <div className="student-dashboard-container">
        {/* Welcome Banner */}
        <div className="student-welcome-banner">
          <div className="student-welcome-content">
            <div className="student-welcome-text">
              <h1>Welcome back, {user.firstname}!</h1>
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
              <p className="student-stat-value">{user.gradelevel}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-success">
              <GraduationCap size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">Section</p>
              <p className="student-stat-value">{user.section}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-warning">
              <BookOpen size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">Strand</p>
              <p className="student-stat-value">{user.strand}</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon student-stat-icon-info">
              <Calendar size={24} />
            </div>
            <div className="student-stat-info">
              <p className="student-stat-label">School Year</p>
              <p className="student-stat-value">{user.school_year}</p>
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
                  <p>{user.LRN}</p>
                </div>
                <div className="student-info-item">
                  <label>Full Name</label>
                  <p>{user.firstname} {user.middlename} {user.lastname}</p>
                </div>
                <div className="student-info-item">
                  <label>Address</label>
                  <p>
                    <MapPin size={14} className="student-info-icon" />
                    {user.address}
                  </p>
                </div>
                <div className="student-info-item">
                  <label>Contact Number</label>
                  <p>
                    <Phone size={14} className="student-info-icon" />
                    {user.contactnumber}
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
                  <div className="student-academic-value">{user.gradelevel}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">Section</div>
                  <div className="student-academic-value">{user.section}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">Strand</div>
                  <div className="student-academic-value">{user.strand}</div>
                </div>
                <div className="student-academic-item">
                  <div className="student-academic-label">School Year</div>
                  <div className="student-academic-value">{user.school_year}</div>
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
      </div>
    </div>
  );
};

export default StudentDashboard;