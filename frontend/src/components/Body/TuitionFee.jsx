import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Receipt
} from 'lucide-react';
import axios from 'axios';
import './TuitionFee.css';

const TuitionFees = ({ user }) => {
  const [tuitionFees, setTuitionFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    LRN: '',
    status: '',
    school_year: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentFee, setCurrentFee] = useState(null);
  const [feeToDelete, setFeeToDelete] = useState(null);

  const [formData, setFormData] = useState({
    LRN: '',
    school_year: '',
    total_amount: '',
    amount_paid: '',
    due_date: '',
    status: 'Unpaid'
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: '',
    receipt_number: '',
    payment_method: '',
    remarks: ''
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchTuitionFees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tuitionFees, filters]);

  const fetchTuitionFees = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? 'http://localhost:5000/tuition-fees' 
        : `http://localhost:5000/tuition-fees/student/${user.LRN}`;
      const response = await axios.get(url);
      setTuitionFees(response.data);
      setFilteredFees(response.data);
    } catch (err) {
      setError('Failed to fetch tuition fees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tuitionFees];

    if (filters.LRN && isAdmin) {
      filtered = filtered.filter(f => 
        (f.LRN?.LRN || f.LRN)?.toLowerCase().includes(filters.LRN.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters.school_year) {
      filtered = filtered.filter(f => f.school_year === filters.school_year);
    }

    setFilteredFees(filtered);
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
      status: '',
      school_year: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNew = () => {
    setCurrentFee(null);
    setFormData({
      LRN: '',
      school_year: '',
      total_amount: '',
      amount_paid: '',
      due_date: '',
      status: 'Unpaid'
    });
    setShowModal(true);
  };

  const handleEdit = (fee) => {
    setCurrentFee(fee);
    setFormData({
      LRN: fee.LRN?.LRN || fee.LRN,
      school_year: fee.school_year,
      total_amount: fee.total_amount,
      amount_paid: fee.amount_paid,
      due_date: fee.due_date.split('T')[0],
      status: fee.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentFee) {
        await axios.put(`http://localhost:5000/tuition-fees/${currentFee._id}`, formData);
        setSuccess('Tuition fee updated successfully');
      } else {
        await axios.post('http://localhost:5000/tuition-fees', formData);
        setSuccess('Tuition fee created successfully');
      }
      fetchTuitionFees();
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tuition fee');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (fee) => {
    setFeeToDelete(fee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/tuition-fees/${feeToDelete._id}`);
      setSuccess('Tuition fee deleted successfully');
      fetchTuitionFees();
      setShowDeleteModal(false);
      setFeeToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete tuition fee');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePaymentClick = (fee) => {
    setCurrentFee(fee);
    setPaymentData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: '',
      payment_method: '',
      remarks: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/tuition-fees/${currentFee._id}/payment`, paymentData);
      setSuccess('Payment added successfully');
      fetchTuitionFees();
      setShowPaymentModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'tuition-status-paid';
      case 'Partially Paid': return 'tuition-status-partial';
      case 'Unpaid': return 'tuition-status-unpaid';
      case 'Overdue': return 'tuition-status-overdue';
      default: return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="tuition-fees-wrapper">
      <div className="tuition-fees-container">
        {/* Header */}
        <div className="tuition-header">
          <div className="tuition-header-content">
            <div className="tuition-header-text">
              <h1>
                <DollarSign size={32} />
                Tuition Fees Management
              </h1>
              <p>Monitor and manage tuition fee records</p>
            </div>
            {isAdmin && (
              <button className="tuition-add-btn" onClick={handleAddNew}>
                <Plus size={20} />
                Add Tuition Fee
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="tuition-alert tuition-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="tuition-alert tuition-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="tuition-filters-card">
          <div className="tuition-filters-header">
            <h2>
              <Filter size={20} />
              Filter Tuition Fees
            </h2>
            <button className="tuition-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="tuition-filters-grid">
            {isAdmin && (
              <div className="tuition-filter-group">
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
            )}

            <div className="tuition-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="tuition-filter-group">
              <label>School Year</label>
              <input
                type="text"
                name="school_year"
                value={filters.school_year}
                onChange={handleFilterChange}
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
        </div>

        {/* Tuition Fees List */}
        <div className="tuition-fees-card">
          <div className="tuition-fees-header">
            <h2>
              Tuition Fees List
              <span className="tuition-fees-count">
                ({filteredFees.length} {filteredFees.length === 1 ? 'record' : 'records'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="tuition-loading">Loading tuition fees...</div>
          ) : filteredFees.length === 0 ? (
            <div className="tuition-no-data">
              <DollarSign size={48} />
              <p>No tuition fee records found</p>
            </div>
          ) : (
            <div className="tuition-table-container">
              <table className="tuition-fees-table">
                <thead>
                  <tr>
                    {isAdmin && <th>LRN</th>}
                    {isAdmin && <th>Student Name</th>}
                    <th>School Year</th>
                    <th>Total Amount</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee._id}>
                      {isAdmin && <td>{fee.LRN?.LRN || fee.LRN}</td>}
                      {isAdmin && (
                        <td>
                          {fee.LRN?.firstname} {fee.LRN?.middlename} {fee.LRN?.lastname}
                        </td>
                      )}
                      <td>{fee.school_year}</td>
                      <td>{formatCurrency(fee.total_amount)}</td>
                      <td>{formatCurrency(fee.amount_paid)}</td>
                      <td className="tuition-balance">{formatCurrency(fee.balance)}</td>
                      <td>{formatDate(fee.due_date)}</td>
                      <td>
                        <span className={`tuition-status ${getStatusClass(fee.status)}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td>
                        <div className="tuition-action-buttons">
                          {isAdmin && (
                            <>
                              <button
                                className="tuition-action-btn tuition-action-btn-payment"
                                onClick={() => handlePaymentClick(fee)}
                                title="Add Payment"
                              >
                                <Receipt size={16} />
                              </button>
                              <button
                                className="tuition-action-btn tuition-action-btn-edit"
                                onClick={() => handleEdit(fee)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="tuition-action-btn tuition-action-btn-delete"
                                onClick={() => handleDeleteClick(fee)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {!isAdmin && fee.payment_history && fee.payment_history.length > 0 && (
                            <button className="tuition-view-history-btn">
                              View History ({fee.payment_history.length})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal">
              <div className="tuition-modal-header">
                <h3>{currentFee ? 'Edit Tuition Fee' : 'Add Tuition Fee'}</h3>
                <button className="tuition-modal-close" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="tuition-modal-body">
                  <div className="tuition-form-group">
                    <label>LRN *</label>
                    <input
                      type="text"
                      name="LRN"
                      value={formData.LRN}
                      onChange={handleInputChange}
                      required
                      disabled={currentFee}
                    />
                  </div>

                  <div className="tuition-form-group">
                    <label>School Year *</label>
                    <input
                      type="text"
                      name="school_year"
                      value={formData.school_year}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024-2025"
                      required
                    />
                  </div>

                  <div className="tuition-form-row">
                    <div className="tuition-form-group">
                      <label>Total Amount *</label>
                      <input
                        type="number"
                        name="total_amount"
                        value={formData.total_amount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="tuition-form-group">
                      <label>Amount Paid</label>
                      <input
                        type="number"
                        name="amount_paid"
                        value={formData.amount_paid}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="tuition-form-group">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="tuition-form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="tuition-modal-actions">
                  <button
                    type="button"
                    className="tuition-modal-btn tuition-modal-btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="tuition-modal-btn tuition-modal-btn-save">
                    {currentFee ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal">
              <div className="tuition-modal-header">
                <h3>Add Payment</h3>
                <button className="tuition-modal-close" onClick={() => setShowPaymentModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="tuition-modal-body">
                  <div className="tuition-payment-info">
                    <p><strong>Student:</strong> {currentFee?.LRN?.firstname} {currentFee?.LRN?.lastname}</p>
                    <p><strong>Balance:</strong> {formatCurrency(currentFee?.balance)}</p>
                  </div>

                  <div className="tuition-form-group">
                    <label>Payment Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      min="0"
                      max={currentFee?.balance}
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="tuition-form-group">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={paymentData.payment_date}
                      onChange={handlePaymentInputChange}
                      required
                    />
                  </div>

                  <div className="tuition-form-group">
                    <label>Receipt Number</label>
                    <input
                      type="text"
                      name="receipt_number"
                      value={paymentData.receipt_number}
                      onChange={handlePaymentInputChange}
                    />
                  </div>

                  <div className="tuition-form-group">
                    <label>Payment Method</label>
                    <select 
                      name="payment_method" 
                      value={paymentData.payment_method} 
                      onChange={handlePaymentInputChange}
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </div>

                  <div className="tuition-form-group">
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={paymentData.remarks}
                      onChange={handlePaymentInputChange}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="tuition-modal-actions">
                  <button
                    type="button"
                    className="tuition-modal-btn tuition-modal-btn-cancel"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="tuition-modal-btn tuition-modal-btn-save">
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal">
              <div className="tuition-modal-header">
                <h3>Confirm Delete</h3>
                <button className="tuition-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="tuition-modal-body">
                <p>Are you sure you want to delete this tuition fee record?</p>
                <p className="tuition-modal-warning">This action cannot be undone.</p>
              </div>
              <div className="tuition-modal-actions">
                <button
                  className="tuition-modal-btn tuition-modal-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="tuition-modal-btn tuition-modal-btn-delete"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TuitionFees;