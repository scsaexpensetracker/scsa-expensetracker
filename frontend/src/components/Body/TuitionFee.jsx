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
  Receipt,
  History,
  Eye
} from 'lucide-react';
import axios from 'axios';
import './TuitionFee.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TuitionFees = ({ user }) => {
  const [tuitionFees, setTuitionFees] = useState([]);
  const [filteredFees, setFilteredFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    LRN: '',
    status: '',
    school_year: '',
    semester: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [currentFee, setCurrentFee] = useState(null);
  const [formData, setFormData] = useState({
    LRN: '',
    school_year: '',
    semester: '1st Semester',
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
        ? `${API_URL}/tuition-fees` 
        : `${API_URL}/tuition-fees/student/${user.LRN}`;
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

    if (filters.semester) {
      filtered = filtered.filter(f => f.semester === filters.semester);
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
      school_year: '',
      semester: ''
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
    setFormData({
      LRN: '',
      school_year: '',
      semester: '1st Semester',
      total_amount: '',
      amount_paid: '',
      due_date: '',
      status: 'Unpaid'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tuition-fees`, formData);
      setSuccess('Tuition fee created successfully');
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
      await axios.delete(`${API_URL}/tuition-fees/${feeToDelete._id}`);
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
      await axios.post(`${API_URL}/tuition-fees/${currentFee._id}/payment`, paymentData);
      setSuccess('Payment added successfully');
      fetchTuitionFees();
      setShowPaymentModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewHistory = (fee) => {
    setCurrentFee(fee);
    setShowHistoryModal(true);
  };

  const handleEditPayment = (payment) => {
    setCurrentPayment(payment);
    setPaymentData({
      amount: payment.amount,
      payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
      receipt_number: payment.receipt_number || '',
      payment_method: payment.payment_method || '',
      remarks: payment.remarks || ''
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/tuition-fees/${currentFee._id}/payment/${currentPayment._id}`,
        paymentData
      );
      setSuccess('Payment updated successfully');
      fetchTuitionFees();
      setShowEditPaymentModal(false);
      setShowHistoryModal(false);
      setTimeout(() => {
        setSuccess('');
        handleViewHistory(tuitionFees.find(f => f._id === currentFee._id));
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeletePaymentClick = (payment) => {
    setPaymentToDelete(payment);
    setShowDeletePaymentModal(true);
  };

  const handleDeletePaymentConfirm = async () => {
    try {
      await axios.delete(
        `${API_URL}/tuition-fees/${currentFee._id}/payment/${paymentToDelete._id}`
      );
      setSuccess('Payment deleted successfully');
      fetchTuitionFees();
      setShowDeletePaymentModal(false);
      setShowHistoryModal(false);
      setTimeout(() => {
        setSuccess('');
        const updatedFee = tuitionFees.find(f => f._id === currentFee._id);
        if (updatedFee) {
          handleViewHistory(updatedFee);
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              <label>Semester</label>
              <select name="semester" value={filters.semester} onChange={handleFilterChange}>
                <option value="">All Semesters</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
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
                    <th>Semester</th>
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
                      <td>{fee.semester}</td>
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
                          {fee.payment_history && fee.payment_history.length > 0 && (
                            <button
                              className="tuition-action-btn tuition-action-btn-history"
                              onClick={() => handleViewHistory(fee)}
                              title="View Payment History"
                            >
                              <History size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                className="tuition-action-btn tuition-action-btn-payment"
                                onClick={() => handlePaymentClick(fee)}
                                title="Add Payment"
                                disabled={fee.balance === 0}
                              >
                                <Receipt size={16} />
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
                <h3>Add Tuition Fee</h3>
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
                    />
                  </div>

                  <div className="tuition-form-row">
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

                    <div className="tuition-form-group">
                      <label>Semester *</label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                      </select>
                    </div>
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
                    Create
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
                    <p><strong>Semester:</strong> {currentFee?.semester}</p>
                    <p><strong>Current Balance:</strong> {formatCurrency(currentFee?.balance)}</p>
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
                    <small className="form-hint">
                      Maximum: {formatCurrency(currentFee?.balance)}
                    </small>
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

        {/* Payment History Modal */}
        {showHistoryModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal tuition-modal-large">
              <div className="tuition-modal-header">
                <h3>Payment History</h3>
                <button className="tuition-modal-close" onClick={() => setShowHistoryModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="tuition-modal-body">
                <div className="tuition-payment-info">
                  <p><strong>Student:</strong> {currentFee?.LRN?.firstname} {currentFee?.LRN?.middlename} {currentFee?.LRN?.lastname}</p>
                  <p><strong>LRN:</strong> {currentFee?.LRN?.LRN || currentFee?.LRN}</p>
                  <p><strong>School Year:</strong> {currentFee?.school_year}</p>
                  <p><strong>Semester:</strong> {currentFee?.semester}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(currentFee?.total_amount)}</p>
                  <p><strong>Current Balance:</strong> <span className="tuition-balance">{formatCurrency(currentFee?.balance)}</span></p>
                  <p><strong>Status:</strong> <span className={`tuition-status ${getStatusClass(currentFee?.status)}`}>{currentFee?.status}</span></p>
                </div>

                {currentFee?.payment_history && currentFee.payment_history.length > 0 ? (
                  <div className="tuition-history-table-container">
                    <table className="tuition-history-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Payment Date</th>
                          <th>Amount Paid</th>
                          <th>Balance After Payment</th>
                          <th>Receipt No.</th>
                          <th>Payment Method</th>
                          <th>Remarks</th>
                          {isAdmin && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {currentFee.payment_history.map((payment, index) => (
                          <tr key={payment._id}>
                            <td>{index + 1}</td>
                            <td>{formatDate(payment.payment_date)}</td>
                            <td className="tuition-amount-paid">{formatCurrency(payment.amount)}</td>
                            <td className={payment.balance_after_payment === 0 ? 'tuition-balance-zero' : 'tuition-balance'}>
                              {formatCurrency(payment.balance_after_payment)}
                            </td>
                            <td>{payment.receipt_number || '-'}</td>
                            <td>{payment.payment_method || '-'}</td>
                            <td>{payment.remarks || '-'}</td>
                            {isAdmin && (
                              <td>
                                <div className="tuition-action-buttons">
                                  <button
                                    className="tuition-action-btn tuition-action-btn-edit"
                                    onClick={() => handleEditPayment(payment)}
                                    title="Edit Payment"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className="tuition-action-btn tuition-action-btn-delete"
                                    onClick={() => handleDeletePaymentClick(payment)}
                                    title="Delete Payment"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="tuition-no-data">
                    <Receipt size={48} />
                    <p>No payment history available</p>
                  </div>
                )}
              </div>
              <div className="tuition-modal-actions">
                <button
                  className="tuition-modal-btn tuition-modal-btn-cancel"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payment Modal */}
        {showEditPaymentModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal">
              <div className="tuition-modal-header">
                <h3>Edit Payment</h3>
                <button className="tuition-modal-close" onClick={() => setShowEditPaymentModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditPaymentSubmit}>
                <div className="tuition-modal-body">
                  <div className="tuition-form-group">
                    <label>Payment Amount *</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      min="0"
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
                    onClick={() => setShowEditPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="tuition-modal-btn tuition-modal-btn-save">
                    Update Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Payment Modal */}
        {showDeletePaymentModal && (
          <div className="tuition-modal-overlay">
            <div className="tuition-modal">
              <div className="tuition-modal-header">
                <h3>Confirm Delete Payment</h3>
                <button className="tuition-modal-close" onClick={() => setShowDeletePaymentModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="tuition-modal-body">
                <p>Are you sure you want to delete this payment record?</p>
                <div className="tuition-payment-details">
                  <p><strong>Amount:</strong> {formatCurrency(paymentToDelete?.amount)}</p>
                  <p><strong>Date:</strong> {formatDate(paymentToDelete?.payment_date)}</p>
                  <p><strong>Receipt:</strong> {paymentToDelete?.receipt_number || 'N/A'}</p>
                </div>
                <p className="tuition-modal-warning">
                  This will recalculate all balances for subsequent payments. This action cannot be undone.
                </p>
              </div>
              <div className="tuition-modal-actions">
                <button
                  className="tuition-modal-btn tuition-modal-btn-cancel"
                  onClick={() => setShowDeletePaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="tuition-modal-btn tuition-modal-btn-delete"
                  onClick={handleDeletePaymentConfirm}
                >
                  Delete Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Tuition Fee Modal */}
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
                <div className="tuition-payment-details">
                  <p><strong>Student:</strong> {feeToDelete?.LRN?.firstname} {feeToDelete?.LRN?.lastname}</p>
                  <p><strong>School Year:</strong> {feeToDelete?.school_year}</p>
                  <p><strong>Semester:</strong> {feeToDelete?.semester}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(feeToDelete?.total_amount)}</p>
                </div>
                <p className="tuition-modal-warning">
                  This will also delete all payment history. This action cannot be undone.
                </p>
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