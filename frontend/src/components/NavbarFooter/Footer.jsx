import React, { useState } from 'react';
import { Mail, MapPin, Phone, GraduationCap } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const emailAddress = 'scsa.of.samal@gmail.com';
  const schoolLocation = 'St. Catherine of Siena Academy, Samal, Bataan';
  const phoneNumber = '0976 053 1954';

  const handleEmailClick = async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      setShowEmailModal(true);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleLocationClick = () => {
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=St+Catherine+of+Siena+Academy+Samal+Bataan';
    window.open(mapsUrl, '_blank');
  };

  const handleProceedToGmail = () => {
    window.open('https://mail.google.com/mail/?view=cm&fs=1&tf=1', '_blank');
    setShowEmailModal(false);
  };

  const handleCloseModal = () => {
    setShowEmailModal(false);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About Section */}
          <div className="footer-section">
            <div className="footer-logo">
              <GraduationCap size={32} />
            </div>
            <h3>St. Catherine of Siena Academy</h3>
            <p className="footer-about-text">
              Committed to providing quality education and fostering academic excellence, 
              faith, and character development in every student.
            </p>
          </div>

          {/* Mission and Vision */}
          <div className="footer-section">
            {/* <h3>Mission and Vision</h3> */}
            <div className="mission-vision">
              <p className="footer-about-text">
              <h4>Mission</h4> As a Christ-centered institution, we aim to transform lives through holistic and innovative Catholic education and service to others.
              </p>
              <p className="footer-about-text">
              <h4>Vision</h4> Guided by Ora et Labora, "Pray and Work", we aspire to become a leading institution of faith, service, and competence in Samal and nearby towns by 2028.
              </p>
              <h4>Core Values</h4>
              <p className="footer-about-text">
                Faith, Service, Competence
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="footer-section">
            <h3>Contact Us</h3>
            <div className="footer-contact-list">
              <div 
                className="footer-contact-item footer-contact-item-clickable"
                onClick={handleLocationClick}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationClick()}
              >
                <MapPin size={16} />
                <span>{schoolLocation}</span>
              </div>
              <div 
                className="footer-contact-item footer-contact-item-clickable"
                onClick={handleEmailClick}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailClick()}
              >
                <Mail size={16} />
                <span>{emailAddress}</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={16} />
                <span>{phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Confirmation Modal */}
        {showEmailModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Email Copied!</h3>
              <p>SCSA's email contact has been copied to your clipboard. Would you like to proceed to Gmail?</p>
              <div className="modal-buttons">
                <button className="modal-btn modal-btn-primary" onClick={handleProceedToGmail}>
                  Open Gmail
                </button>
                <button className="modal-btn modal-btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Copyright and Tagline */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} St. Catherine of Siena Academy, Samal, Bataan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;