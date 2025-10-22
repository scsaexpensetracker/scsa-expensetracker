import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './Login.css';
import SCSA_LOGO from '../SCSA/SCSA_Logo.jpg';
import SCSA_HS from '../SCSA/HS.JPG';
import SCSA_Church from '../SCSA/Church.jpg';
import SCSA_Grounds from '../SCSA/SCSA_Grounds.jpg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    LRN: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [SCSA_HS, SCSA_Church, SCSA_Grounds];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      
      if (response.data.user) {
        onLogin(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`login-background ${index === currentImageIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url(${image})` }}
        ></div>
      ))}
      
      <div className="login-content">
        <div className="login-card">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="login-logo">
              <img src={SCSA_LOGO} alt="SCSA Logo" />
            </div>
            <h1>SCSA Financial Portal</h1>
            <p>St. Catherine of Siena Academy</p>
            <p className="login-subtitle">Samal, Bataan</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="LRN">
                <User size={18} />
                LRN (Learner Reference Number)
              </label>
              <input
                type="text"
                id="LRN"
                name="LRN"
                value={formData.LRN}
                onChange={handleChange}
                placeholder="Enter your LRN"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2025 St. Catherine of Siena Academy</p>
            {/* <p className="login-help">Need help? Contact the Finance Office</p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;