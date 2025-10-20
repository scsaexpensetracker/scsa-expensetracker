import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  AlertCircle,
  CheckCircle,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';
import axios from 'axios';
import './PaymentHistory.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PaymentHistory = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  
  const [filters, setFilters] = useState({
    LRN: '',
    gradelevel: '',
    section: '',
    payment_type: '',
    payment_method: '',
    school_year: ''
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchPayments();
    if (!isAdmin) {
      fetchStats();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? `${API_URL}/payment-history` 
        : `${API_URL}/payment-history/student/${user.LRN}`;
      const response = await axios.get(url);
      setPayments(response.data);
      setFilteredPayments(response.data);
      
      // Calculate admin stats from all payments
      if (isAdmin) {
        calculateAdminStats(response.data);
      }
    } catch (err) {
      setError('Failed to fetch payment history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-history/stats/${user.LRN}`);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const calculateAdminStats = (paymentsData) => {
    const totalAmount = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCount = paymentsData.length;
    
    // Get unique students
    const uniqueStudents = new Set(paymentsData.map(p => p.LRN?.LRN || p.LRN));
    const studentCount = uniqueStudents.size;
    
    // Payment by type
    const paymentsByType = paymentsData.reduce((acc, payment) => {
      acc[payment.payment_type] = (acc[payment.payment_type] || 0) + payment.amount;
      return acc;
    }, {});

    // Payment by method
    const paymentsByMethod = paymentsData.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
      return acc;
    }, {});

    setAdminStats({
      totalAmount,
      totalCount,
      studentCount,
      paymentsByType,
      paymentsByMethod
    });
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (filters.LRN && isAdmin) {
      filtered = filtered.filter(p => 
        (p.LRN?.LRN || p.LRN)?.toLowerCase().includes(filters.LRN.toLowerCase())
      );
    }

    if (filters.gradelevel && isAdmin) {
      filtered = filtered.filter(p => p.LRN?.gradelevel === filters.gradelevel);
    }

    if (filters.section && isAdmin) {
      filtered = filtered.filter(p => p.LRN?.section === filters.section);
    }

    if (filters.payment_type) {
      filtered = filtered.filter(p => p.payment_type === filters.payment_type);
    }

    if (filters.payment_method) {
      filtered = filtered.filter(p => p.payment_method === filters.payment_method);
    }

    if (filters.school_year) {
      filtered = filtered.filter(p => p.school_year === filters.school_year);
    }

    setFilteredPayments(filtered);
    
    // Recalculate admin stats based on filtered data
    if (isAdmin) {
      calculateAdminStats(filtered);
    }
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
      gradelevel: '',
      section: '',
      payment_type: '',
      payment_method: '',
      school_year: ''
    });
  };

  const handleDownloadReceipt = (payment) => {
    const receiptContent = `
SAINT CATHERINE OF SIENA ACADEMY
Official Receipt
----------------------------------------
Receipt Number: ${payment.receipt_number}
Date: ${formatDate(payment.payment_date)}

Student Information:
LRN: ${payment.LRN?.LRN || payment.LRN}
Name: ${payment.LRN?.firstname || ''} ${payment.LRN?.middlename || ''} ${payment.LRN?.lastname || ''}
Grade Level: ${payment.LRN?.gradelevel || ''}
Section: ${payment.LRN?.section || ''}

Payment Details:
Type: ${payment.payment_type}
Description: ${payment.description}
Amount: ${formatCurrency(payment.amount)}
Payment Method: ${payment.payment_method}
School Year: ${payment.school_year}

Processed By: ${payment.processed_by}
${payment.remarks ? 'Remarks: ' + payment.remarks : ''}

----------------------------------------
This is an official receipt from SCSA
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${payment.receipt_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="ph-wrapper">
      <div className="ph-container">
        {/* Header */}
        <div className="ph-header">
          <div className="ph-header-content">
            <div className="ph-header-text">
              <h1>
                <Receipt size={32} />
                Payment History
              </h1>
              <p>View payment transaction records</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="ph-alert ph-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="ph-alert ph-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Cards */}
        {!isAdmin && stats && (
          <div className="ph-stats-grid">
            <div className="ph-stat-card">
              <div className="ph-stat-icon ph-stat-icon-total">
                <DollarSign size={24} />
              </div>
              <div className="ph-stat-content">
                <h3>Total Payments</h3>
                <p className="ph-stat-value">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
            <div className="ph-stat-card">
              <div className="ph-stat-icon ph-stat-icon-count">
                <Receipt size={24} />
              </div>
              <div className="ph-stat-content">
                <h3>Transaction Count</h3>
                <p className="ph-stat-value">{stats.paymentCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Dashboard Stats */}
        {isAdmin && adminStats && (
          <div className="ph-admin-dashboard">
            <h2 className="ph-dashboard-title">Payment Overview Dashboard</h2>
            <div className="ph-stats-grid">
              <div className="ph-stat-card">
                <div className="ph-stat-icon ph-stat-icon-total">
                  <DollarSign size={28} />
                </div>
                <div className="ph-stat-content">
                  <h3>Total Revenue</h3>
                  <p className="ph-stat-value">{formatCurrency(adminStats.totalAmount)}</p>
                  <span className="ph-stat-label">All Payments</span>
                </div>
              </div>
              <div className="ph-stat-card">
                <div className="ph-stat-icon ph-stat-icon-count">
                  <Receipt size={28} />
                </div>
                <div className="ph-stat-content">
                  <h3>Total Transactions</h3>
                  <p className="ph-stat-value">{adminStats.totalCount}</p>
                  <span className="ph-stat-label">Payment Records</span>
                </div>
              </div>
              <div className="ph-stat-card">
                <div className="ph-stat-icon ph-stat-icon-students">
                  <Users size={28} />
                </div>
                <div className="ph-stat-content">
                  <h3>Students</h3>
                  <p className="ph-stat-value">{adminStats.studentCount}</p>
                  <span className="ph-stat-label">Paying Students</span>
                </div>
              </div>
              <div className="ph-stat-card">
                <div className="ph-stat-icon ph-stat-icon-average">
                  <TrendingUp size={28} />
                </div>
                <div className="ph-stat-content">
                  <h3>Average Payment</h3>
                  <p className="ph-stat-value">
                    {formatCurrency(adminStats.totalCount > 0 ? adminStats.totalAmount / adminStats.totalCount : 0)}
                  </p>
                  <span className="ph-stat-label">Per Transaction</span>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="ph-breakdown-grid">
              <div className="ph-breakdown-card">
                <h3>Payment by Type</h3>
                <div className="ph-breakdown-list">
                  {Object.entries(adminStats.paymentsByType).map(([type, amount]) => (
                    <div key={type} className="ph-breakdown-item">
                      <span className="ph-breakdown-label">{type}</span>
                      <span className="ph-breakdown-value">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ph-breakdown-card">
                <h3>Payment by Method</h3>
                <div className="ph-breakdown-list">
                  {Object.entries(adminStats.paymentsByMethod).map(([method, amount]) => (
                    <div key={method} className="ph-breakdown-item">
                      <span className="ph-breakdown-label">{method}</span>
                      <span className="ph-breakdown-value">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="ph-filters-card">
          <div className="ph-filters-header">
            <h2>
              <Filter size={20} />
              Filter Payments
            </h2>
            <button className="ph-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="ph-filters-grid">
            {isAdmin && (
              <>
                <div className="ph-filter-group">
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

                <div className="ph-filter-group">
                  <label>Grade Level</label>
                  <select name="gradelevel" value={filters.gradelevel} onChange={handleFilterChange}>
                    <option value="">All Grade Levels</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div className="ph-filter-group">
                  <label>Section</label>
                  <select name="section" value={filters.section} onChange={handleFilterChange}>
                    <option value="">Select Section</option>
                    <option value="Virgen Del Rosario">Virgen Del Rosario</option>
                    <option value="Virgen Del Pilar">Virgen Del Pilar</option>
                    <option value="Virgen Del Carmen">Virgen Del Carmen</option>
                    <option value="Virgen Del Carmen">Virgen Del Carmen</option>
                  </select>
                </div>
              </>
            )}

            <div className="ph-filter-group">
              <label>Payment Type</label>
              <select name="payment_type" value={filters.payment_type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="Tuition Fee">Tuition Fee</option>
                <option value="Event Contribution">Event Contribution</option>
                <option value="Uniform">Uniform</option>
                <option value="Book">Book</option>
                <option value="Laboratory Materials">Laboratory Materials</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="ph-filter-group">
              <label>Payment Method</label>
              <select name="payment_method" value={filters.payment_method} onChange={handleFilterChange}>
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online Payment">Online Payment</option>
              </select>
            </div>

            <div className="ph-filter-group">
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

        {/* Payments List */}
        <div className="ph-card">
          <div className="ph-list-header">
            <h2>
              Payment Records
              <span className="ph-count">
                ({filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="ph-loading">Loading payment history...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="ph-no-data">
              <Receipt size={48} />
              <p>No payment records found</p>
            </div>
          ) : (
            <div className="ph-table-container">
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    {isAdmin && <th>LRN</th>}
                    {isAdmin && <th>Student Name</th>}
                    {isAdmin && <th>Grade & Section</th>}
                    <th>Payment Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Payment Date</th>
                    <th>School Year</th>
                    <th>Processed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="ph-receipt-no">{payment.receipt_number}</td>
                      {isAdmin && <td>{payment.LRN?.LRN || payment.LRN}</td>}
                      {isAdmin && (
                        <td>
                          {payment.LRN?.firstname} {payment.LRN?.middlename} {payment.LRN?.lastname}
                        </td>
                      )}
                      {isAdmin && (
                        <td>
                          {payment.LRN?.gradelevel} - {payment.LRN?.section}
                        </td>
                      )}
                      <td>{payment.payment_type}</td>
                      <td>{payment.description}</td>
                      <td className="ph-amount">{formatCurrency(payment.amount)}</td>
                      <td>{payment.payment_method}</td>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{payment.school_year}</td>
                      <td>{payment.processed_by}</td>
                      <td>
                        <div className="ph-action-buttons">
                          <button
                            className="ph-action-btn ph-action-btn-download"
                            onClick={() => handleDownloadReceipt(payment)}
                            title="Download Receipt"
                          >
                            <Download size={16} />
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
      </div>
    </div>
  );
};

export default PaymentHistory;