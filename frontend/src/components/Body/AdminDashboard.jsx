import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    LRN: '',
    section: '',
    lastname: '',
    gradelevel: ''
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/dashboard/users');
      // Filter out admin users
      const studentUsers = response.data.filter(u => u.role === 'student');
      setStudents(studentUsers);
      setFilteredStudents(studentUsers);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    if (filters.LRN) {
      filtered = filtered.filter(s => 
        s.LRN.toLowerCase().includes(filters.LRN.toLowerCase())
      );
    }

    if (filters.section) {
      filtered = filtered.filter(s => s.section === filters.section);
    }

    if (filters.lastname) {
      filtered = filtered.filter(s => 
        s.lastname.toLowerCase().includes(filters.lastname.toLowerCase())
      );
    }

    if (filters.gradelevel) {
      filtered = filtered.filter(s => s.gradelevel === filters.gradelevel);
    }

    setFilteredStudents(filtered);
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
      section: '',
      lastname: '',
      gradelevel: ''
    });
  };

  const handleEdit = (student) => {
    navigate('/edit-profile', { state: { studentData: student, isAdmin: true } });
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/dashboard/users/${studentToDelete.LRN}`);
      setSuccess(`Student ${studentToDelete.firstname} ${studentToDelete.lastname} deleted successfully`);
      fetchStudents();
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete student');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-text">
              <h1>
                <Users size={32} />
                Student Management
              </h1>
              <p>Manage student records and information</p>
            </div>
            <button 
              className="admin-add-student-btn"
              onClick={() => navigate('/register')}
            >
              <UserPlus size={20} />
              Register New Student
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="admin-alert admin-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="admin-alert admin-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="admin-filters-card">
          <div className="admin-filters-header">
            <h2>
              <Filter size={20} />
              Filter Students
            </h2>
            <button className="admin-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="admin-filters-grid">
            <div className="admin-filter-group">
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

            <div className="admin-filter-group">
              <label>
                <Search size={16} />
                Search by Last Name
              </label>
              <input
                type="text"
                name="lastname"
                value={filters.lastname}
                onChange={handleFilterChange}
                placeholder="Enter last name"
              />
            </div>

            <div className="admin-filter-group">
              <label>Grade Level</label>
              <select
                name="gradelevel"
                value={filters.gradelevel}
                onChange={handleFilterChange}
              >
                <option value="">All Grade Levels</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className="admin-filter-group">
              <label>Section</label>
              <select
                name="section"
                value={filters.section}
                onChange={handleFilterChange}
              >
                <option value="">All Sections</option>
                <option value="Section 1">Section 1</option>
                <option value="Section 2">Section 2</option>
                <option value="Section 3">Section 3</option>
                <option value="Section 4">Section 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="admin-students-card">
          <div className="admin-students-header">
            <h2>
              Students List
              <span className="admin-students-count">
                ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="admin-loading">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="admin-no-data">
              <Users size={48} />
              <p>No students found</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-students-table">
                <thead>
                  <tr>
                    <th>LRN</th>
                    <th>Full Name</th>
                    <th>Grade Level</th>
                    <th>Section</th>
                    <th>Strand</th>
                    <th>Contact Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.LRN}>
                      <td>{student.LRN}</td>
                      <td>
                        {student.firstname} {student.middlename} {student.lastname}
                      </td>
                      <td>{student.gradelevel}</td>
                      <td>{student.section}</td>
                      <td>{student.strand}</td>
                      <td>{student.contactnumber}</td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            className="admin-action-btn admin-action-btn-edit"
                            onClick={() => handleEdit(student)}
                            title="Edit Student"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn-delete"
                            onClick={() => handleDeleteClick(student)}
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h3>Confirm Delete</h3>
                <button 
                  className="admin-modal-close"
                  onClick={handleDeleteCancel}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p>
                  Are you sure you want to delete student{' '}
                  <strong>
                    {studentToDelete?.firstname} {studentToDelete?.lastname}
                  </strong>{' '}
                  (LRN: {studentToDelete?.LRN})?
                </p>
                <p className="admin-modal-warning">
                  This action cannot be undone.
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  className="admin-modal-btn admin-modal-btn-cancel"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
                <button
                  className="admin-modal-btn admin-modal-btn-delete"
                  onClick={handleDeleteConfirm}
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;