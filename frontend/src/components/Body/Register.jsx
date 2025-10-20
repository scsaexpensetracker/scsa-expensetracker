import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle, DollarSign, Plus, X } from 'lucide-react';
import axios from 'axios';
import './Register.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TUITION_FEES = {
  'STEM': 25000,
  'ABM': 22000,
  'HUMSS': 20000
};

const SECTION_BY_STRAND = {
  'STEM': ['Virgen Del Rosario', 'Virgen Del Pilar'],
  'ABM': ['Virgen Del Carmen'],
  'HUMSS': ['Virgen Del Carmen']
};

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
  
  const [tuitionDetails, setTuitionDetails] = useState({
    enabled: false,
    semester: '1st Semester',
    amount_paid: '',
    due_date: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Reset section when strand changes
      if (name === 'strand') {
        updated.section = '';
      }
      
      return updated;
    });
    
    setError('');
    setSuccess('');
  };

  const handleTuitionChange = (e) => {
    setTuitionDetails({
      ...tuitionDetails,
      [e.target.name]: e.target.value
    });
  };

  const toggleTuitionDetails = () => {
    setTuitionDetails(prev => ({
      ...prev,
      enabled: !prev.enabled,
      semester: prev.enabled ? '1st Semester' : prev.semester,
      amount_paid: prev.enabled ? '' : prev.amount_paid,
      due_date: prev.enabled ? '' : prev.due_date
    }));
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

    // Validate tuition details if enabled
    if (tuitionDetails.enabled) {
      if (!tuitionDetails.due_date) {
        setError('Please provide a due date for the tuition fee');
        setLoading(false);
        return;
      }

      if (!tuitionDetails.semester) {
        setError('Please select a semester');
        setLoading(false);
        return;
      }
      
      const amountPaid = parseFloat(tuitionDetails.amount_paid) || 0;
      const totalAmount = TUITION_FEES[formData.strand];
      
      if (amountPaid > totalAmount) {
        setError(`Amount paid cannot exceed the total tuition fee of ₱${totalAmount.toLocaleString()}`);
        setLoading(false);
        return;
      }
    }

    try {
      // Register the student
      const registerResponse = await axios.post(`${API_URL}/auth/register`, formData);
      
      // Always create tuition fee record if tuition details are enabled
      if (tuitionDetails.enabled) {
        const totalAmount = TUITION_FEES[formData.strand];
        const amountPaid = parseFloat(tuitionDetails.amount_paid) || 0;
        
        const tuitionData = {
          LRN: formData.LRN,
          school_year: formData.school_year,
          semester: tuitionDetails.semester,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          due_date: tuitionDetails.due_date
        };
        
        await axios.post(`${API_URL}/tuition-fees`, tuitionData);
      }
      
      setSuccess(registerResponse.data.message + (tuitionDetails.enabled ? ' with tuition fee record' : ''));
      
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
        setTuitionDetails({
          enabled: false,
          semester: '1st Semester',
          amount_paid: '',
          due_date: ''
        });
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableSections = formData.strand ? SECTION_BY_STRAND[formData.strand] : [];
  const tuitionAmount = formData.strand ? TUITION_FEES[formData.strand] : 0;

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
                <label htmlFor="strand">Strand *</label>
                <select
                  id="strand"
                  name="strand"
                  value={formData.strand}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Strand</option>
                  <option value="STEM">STEM</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
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
                  disabled={!formData.strand}
                >
                  <option value="">
                    {formData.strand ? 'Select Section' : 'Select Strand First'}
                  </option>
                  {availableSections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
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

            {/* Tuition Details Section */}
            <div className="tuition-details-section">
              <button 
                type="button" 
                className="tuition-toggle-btn"
                onClick={toggleTuitionDetails}
              >
                {tuitionDetails.enabled ? <X size={18} /> : <Plus size={18} />}
                {tuitionDetails.enabled ? 'Remove Tuition Details' : 'Add Tuition Details'}
              </button>

              {tuitionDetails.enabled && (
                <div className="tuition-details-form">
                  <div className="tuition-info-card">
                    <DollarSign size={20} />
                    <div>
                      <p className="tuition-info-label">Tuition Fee for {formData.strand || 'Selected Strand'}</p>
                      <p className="tuition-info-amount">
                        ₱{tuitionAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="semester">Semester *</label>
                      <select
                        id="semester"
                        name="semester"
                        value={tuitionDetails.semester}
                        onChange={handleTuitionChange}
                        required
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="due_date">Due Date *</label>
                      <input
                        type="date"
                        id="due_date"
                        name="due_date"
                        value={tuitionDetails.due_date}
                        onChange={handleTuitionChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label htmlFor="amount_paid">Initial Payment Amount</label>
                      <input
                        type="number"
                        id="amount_paid"
                        name="amount_paid"
                        value={tuitionDetails.amount_paid}
                        onChange={handleTuitionChange}
                        placeholder="Enter amount to pay (leave empty for unpaid)"
                        min="0"
                        max={tuitionAmount}
                        step="0.01"
                      />
                      <small className="form-hint">
                        Leave empty to create an unpaid tuition record. Maximum: ₱{tuitionAmount.toLocaleString()}
                      </small>
                    </div>
                  </div>

                  {tuitionDetails.amount_paid && (
                    <div className="tuition-summary">
                      <div className="tuition-summary-row">
                        <span>Total Tuition:</span>
                        <span>₱{tuitionAmount.toLocaleString()}</span>
                      </div>
                      <div className="tuition-summary-row">
                        <span>Initial Payment:</span>
                        <span>₱{parseFloat(tuitionDetails.amount_paid || 0).toLocaleString()}</span>
                      </div>
                      <div className="tuition-summary-row tuition-summary-balance">
                        <span>Balance:</span>
                        <span>₱{(tuitionAmount - parseFloat(tuitionDetails.amount_paid || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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