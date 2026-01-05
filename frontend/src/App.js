import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/NavbarFooter/Navbar';
import Footer from './components/NavbarFooter/Footer';
import Login from './components/Body/Login';
import Register from './components/Body/Register';
import Dashboard from './components/Body/StudentDashboard';
import AdminDashboard from './components/Body/AdminDashboard';
import TuitionFees from './components/Body/TuitionFee';
import Events from './components/Body/Events';
import UniformsBooks from './components/Body/UniformBooks';
import Notifications from './components/Body/Notifications';
import PaymentHistory from './components/Body/PaymentHistory';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Load user from localStorage on initial load
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [notificationCount, setNotificationCount] = useState(0);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    // Save user to localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setNotificationCount(0);
    // Remove user from localStorage
    localStorage.removeItem('currentUser');
  };

  const handleNotificationUpdate = (count) => {
    setNotificationCount(count);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Render Navbar only if user is logged in */}
        {currentUser && (
          <Navbar 
            user={currentUser} 
            onLogout={handleLogout}
            unreadCount={notificationCount}
            onNotificationUpdate={handleNotificationUpdate}
          />
        )}
        <Routes>
          {/* Login Route */}
          <Route 
            path="/" 
            element={
              currentUser ? (
                <Navigate to={currentUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />

          {/* Student Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              currentUser && currentUser.role === 'student' ? (
                <Dashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Admin Dashboard */}
          <Route 
            path="/admin-dashboard" 
            element={
              currentUser && currentUser.role === 'admin' ? (
                <AdminDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Tuition Fees Route */}
          <Route 
            path="/tuition-fees" 
            element={
              currentUser ? (
                <TuitionFees user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Events Route */}
          <Route 
            path="/events" 
            element={
              currentUser ? (
                <Events user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Uniforms & Books Route */}
          <Route 
            path="/uniforms-books" 
            element={
              currentUser ? (
                <UniformsBooks user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Notifications Route */}
          <Route 
            path="/notifications" 
            element={
              currentUser ? (
                <Notifications 
                  user={currentUser}
                  onNotificationUpdate={handleNotificationUpdate}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Payment History Route */}
          <Route 
            path="/payment-history" 
            element={
              currentUser ? (
                <PaymentHistory user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Register Route (only accessible from admin dashboard) */}
          <Route 
            path="/register" 
            element={
              currentUser && currentUser.role === 'admin' ? (
                <Register user={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Render Footer only if user is logged in */}
        {currentUser && <Footer />}
      </div>
    </Router>
  );
}

export default App;