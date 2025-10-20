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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SECTION_BY_STRAND = {
  'STEM': ['Virgen Del Rosario', 'Virgen Del Pilar'],
  'ABM': ['Virgen Del Carmen'],
  'HUMSS': ['Virgen Del Carmen']
};

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dashboard/users`);
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

  const handleEditClick = (student) => {
    setStudentToEdit(student);
    setEditFormData({
      firstname: student.firstname,
      middlename: student.middlename,
      lastname: student.lastname,
      address: student.address,
      gradelevel: student.gradelevel,
      section: student.section,
      strand: student.strand,
      school_year: student.school_year,
      contactnumber: student.contactnumber
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    setEditFormData(prev => {
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
    
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    // Validate all fields are filled
    const emptyFields = Object.entries(editFormData).filter(([key, value]) => !value);
    if (emptyFields.length > 0) {
      setEditError('All fields are required');
      setEditLoading(false);
      return;
    }

    try {
      await axios.put(`${API_URL}/dashboard/users/${studentToEdit.LRN}`, editFormData);
      setSuccess(`Student ${editFormData.firstname} ${editFormData.lastname} updated successfully`);
      fetchStudents();
      setShowEditModal(false);
      setStudentToEdit(null);
      setEditFormData({});
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setStudentToEdit(null);
    setEditFormData({});
    setEditError('');
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/dashboard/users/${studentToDelete.LRN}`);
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

  const availableEditSections = editFormData.strand ? SECTION_BY_STRAND[editFormData.strand] : [];

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
                <option value="Virgen Del Rosario">Virgen Del Rosario</option>
                <option value="Virgen Del Pilar">Virgen Del Pilar</option>
                <option value="Virgen Del Carmen">Virgen Del Carmen</option>
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
                            onClick={() => handleEditClick(student)}
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal admin-modal-large">
              <div className="admin-modal-header">
                <h3>Edit Student Information</h3>
                <button 
                  className="admin-modal-close"
                  onClick={handleEditCancel}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="admin-modal-body">
                  {editError && (
                    <div className="admin-alert admin-alert-error">
                      <AlertCircle size={18} />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div className="admin-edit-info">
                    <p><strong>LRN:</strong> {studentToEdit?.LRN}</p>
                    <p className="admin-edit-note">Note: LRN cannot be changed</p>
                  </div>

                  <div className="admin-edit-form">
                    <div className="admin-edit-row">
                      <div className="admin-edit-group">
                        <label htmlFor="edit-firstname">First Name *</label>
                        <input
                          type="text"
                          id="edit-firstname"
                          name="firstname"
                          value={editFormData.firstname}
                          onChange={handleEditFormChange}
                          placeholder="Enter first name"
                          required
                        />
                      </div>

                      <div className="admin-edit-group">
                        <label htmlFor="edit-middlename">Middle Name *</label>
                        <input
                          type="text"
                          id="edit-middlename"
                          name="middlename"
                          value={editFormData.middlename}
                          onChange={handleEditFormChange}
                          placeholder="Enter middle name"
                          required
                        />
                      </div>

                      <div className="admin-edit-group">
                        <label htmlFor="edit-lastname">Last Name *</label>
                        <input
                          type="text"
                          id="edit-lastname"
                          name="lastname"
                          value={editFormData.lastname}
                          onChange={handleEditFormChange}
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                    </div>

                    <div className="admin-edit-row">
                      <div className="admin-edit-group admin-edit-group-full">
                        <label htmlFor="edit-address">Address *</label>
                        <input
                          type="text"
                          id="edit-address"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditFormChange}
                          placeholder="Enter complete address"
                          required
                        />
                      </div>
                    </div>

                    <div className="admin-edit-row">
                      <div className="admin-edit-group">
                        <label htmlFor="edit-gradelevel">Grade Level *</label>
                        <select
                          id="edit-gradelevel"
                          name="gradelevel"
                          value={editFormData.gradelevel}
                          onChange={handleEditFormChange}
                          required
                        >
                          <option value="">Select Grade Level</option>
                          <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                      </div>

                      <div className="admin-edit-group">
                        <label htmlFor="edit-strand">Strand *</label>
                        <select
                          id="edit-strand"
                          name="strand"
                          value={editFormData.strand}
                          onChange={handleEditFormChange}
                          required
                        >
                          <option value="">Select Strand</option>
                          <option value="STEM">STEM</option>
                          <option value="ABM">ABM</option>
                          <option value="HUMSS">HUMSS</option>
                        </select>
                      </div>

                      <div className="admin-edit-group">
                        <label htmlFor="edit-section">Section *</label>
                        <select
                          id="edit-section"
                          name="section"
                          value={editFormData.section}
                          onChange={handleEditFormChange}
                          required
                          disabled={!editFormData.strand}
                        >
                          <option value="">
                            {editFormData.strand ? 'Select Section' : 'Select Strand First'}
                          </option>
                          {availableEditSections.map(section => (
                            <option key={section} value={section}>{section}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="admin-edit-row">
                      <div className="admin-edit-group">
                        <label htmlFor="edit-school_year">School Year *</label>
                        <input
                          type="text"
                          id="edit-school_year"
                          name="school_year"
                          value={editFormData.school_year}
                          onChange={handleEditFormChange}
                          placeholder="e.g., 2024-2025"
                          required
                        />
                      </div>

                      <div className="admin-edit-group">
                        <label htmlFor="edit-contactnumber">Contact Number *</label>
                        <input
                          type="text"
                          id="edit-contactnumber"
                          name="contactnumber"
                          value={editFormData.contactnumber}
                          onChange={handleEditFormChange}
                          placeholder="e.g., 09123456789"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-modal-btn admin-modal-btn-cancel"
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-modal-btn admin-modal-btn-save"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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