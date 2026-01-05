import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Protected Route Component
const ProtectedRoute = ({ children, currentUser, requiredRole }) => {
  const location = useLocation();
  
  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard if wrong role
    return <Navigate to={currentUser.role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />;
  }
  
  return children;
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Load user from localStorage on initial load
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Validate that the user object has required properties
        if (user && user.LRN && user.role) {
          return user;
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('currentUser');
    }
    return null;
  });
  
  const [notificationCount, setNotificationCount] = useState(0);

  // Clear invalid localStorage data on mount
  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

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
              <ProtectedRoute currentUser={currentUser} requiredRole="student">
                <Dashboard user={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Admin Dashboard */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredRole="admin">
                <AdminDashboard user={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Tuition Fees Route */}
          <Route 
            path="/tuition-fees" 
            element={
              <ProtectedRoute currentUser={currentUser}>
                <TuitionFees user={currentUser} />
              </ProtectedRoute>
            } 
          />

          {/* Events Route */}
          <Route 
            path="/events" 
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Events user={currentUser} />
              </ProtectedRoute>
            } 
          />

          {/* Uniforms & Books Route */}
          <Route 
            path="/uniforms-books" 
            element={
              <ProtectedRoute currentUser={currentUser}>
                <UniformsBooks user={currentUser} />
              </ProtectedRoute>
            } 
          />

          {/* Notifications Route */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Notifications 
                  user={currentUser}
                  onNotificationUpdate={handleNotificationUpdate}
                />
              </ProtectedRoute>
            } 
          />

          {/* Payment History Route */}
          <Route 
            path="/payment-history" 
            element={
              <ProtectedRoute currentUser={currentUser}>
                <PaymentHistory user={currentUser} />
              </ProtectedRoute>
            } 
          />

          {/* Register Route (only accessible from admin dashboard) */}
          <Route 
            path="/register" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredRole="admin">
                <Register user={currentUser} />
              </ProtectedRoute>
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