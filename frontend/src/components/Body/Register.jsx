import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './Register.css';

const Register = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    LRN: '',
    firstname: '',
    middlename: '',
    lastname: '',
    address: '',
    gradelevel: '',
    section: '',
    strand: '',
    school_year: '2024-2025',
    contactnumber: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Check if all fields are filled
    const emptyFields = Object.entries(formData).filter(([key, value]) => !value);
    if (emptyFields.length > 0) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/auth/register', formData);
      
      setSuccess(response.data.message);
      
      // Reset form after successful registration
      setTimeout(() => {
        setFormData({
          LRN: '',
          firstname: '',
          middlename: '',
          lastname: '',
          address: '',
          gradelevel: '',
          section: '',
          strand: '',
          school_year: '2024-2025',
          contactnumber: '',
          password: ''
        });
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-card">
          <div className="register-header">
            <div className="register-icon">
              <UserPlus size={36} />
            </div>
            <h1>Student Registration</h1>
            <p>Register a new student to the SCSA Financial Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="LRN">LRN (Learner Reference Number) *</label>
                <input
                  type="text"
                  id="LRN"
                  name="LRN"
                  value={formData.LRN}
                  onChange={handleChange}
                  placeholder="Enter LRN"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstname">First Name *</label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="middlename">Middle Name *</label>
                <input
                  type="text"
                  id="middlename"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleChange}
                  placeholder="Enter middle name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname">Last Name *</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gradelevel">Grade Level *</label>
                <select
                  id="gradelevel"
                  name="gradelevel"
                  value={formData.gradelevel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Grade Level</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="section">Section *</label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Section</option>
                  <option value="Section 1">Section 1</option>
                  <option value="Section 2">Section 2</option>
                  <option value="Section 3">Section 3</option>
                  <option value="Section 4">Section 4</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="strand">Strand *</label>
                <input
                  type="text"
                  id="strand"
                  name="strand"
                  value={formData.strand}
                  onChange={handleChange}
                  placeholder="e.g., STEM, HUMSS, ABM"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="school_year">School Year *</label>
                <input
                  type="text"
                  id="school_year"
                  name="school_year"
                  value={formData.school_year}
                  onChange={handleChange}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactnumber">Contact Number *</label>
                <input
                  type="text"
                  id="contactnumber"
                  name="contactnumber"
                  value={formData.contactnumber}
                  onChange={handleChange}
                  placeholder="e.g., 09123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/admin-dashboard')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;