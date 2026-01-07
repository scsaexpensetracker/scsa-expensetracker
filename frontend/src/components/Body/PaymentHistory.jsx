import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import './PaymentHistory.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PaymentHistory = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState({
    LRN: '',
    gradelevel: '',
    section: '',
    payment_type: '',
    payment_method: '',
    school_year: '',
    status: ''
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? `${API_URL}/payment-history/payments` 
        : `${API_URL}/payment-history/student/${user.LRN}`;
      const response = await axios.get(url);
      
      // Ensure response data is an array
      const paymentsData = Array.isArray(response.data) ? response.data : [];
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (err) {
      setError('Failed to fetch payment history');
      console.error(err);
      // Set empty arrays on error
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure payments is an array before spreading
    if (!Array.isArray(payments)) {
      setFilteredPayments([]);
      return;
    }

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

    if (filters.status) {
      filtered = filtered.filter(p => p.status_after_payment === filters.status);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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
      school_year: '',
      status: ''
    });
  };

  const handleDownloadReceipt = (payment) => {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font sizes and styles
    const titleSize = 16;
    const headerSize = 12;
    const normalSize = 10;
    const smallSize = 8;
    
    let yPosition = 20;
    
    // Header - School Name
    doc.setFontSize(titleSize);
    doc.setFont(undefined, 'bold');
    doc.text('SAINT CATHERINE OF SIENA ACADEMY', 105, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(headerSize);
    doc.text('Official Receipt', 105, yPosition, { align: 'center' });
    
    // Line separator
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    
    // Receipt Number and Date
    yPosition += 10;
    doc.setFontSize(normalSize);
    doc.setFont(undefined, 'bold');
    doc.text('Receipt Number:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.receipt_number, 60, yPosition);
    
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 120, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(payment.payment_date), 135, yPosition);
    
    // Student Information Section
    yPosition += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(headerSize);
    doc.text('Student Information:', 20, yPosition);
    
    yPosition += 7;
    doc.setFontSize(normalSize);
    
    if (payment.LRN && typeof payment.LRN === 'object') {
      doc.setFont(undefined, 'bold');
      doc.text('LRN:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(payment.LRN.LRN || 'N/A', 40, yPosition);
      
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Name:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      const fullName = `${payment.LRN.firstname || ''} ${payment.LRN.middlename || ''} ${payment.LRN.lastname || ''}`.trim();
      doc.text(fullName, 40, yPosition);
      
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Grade Level:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(payment.LRN.gradelevel || '', 50, yPosition);
      
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Section:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(payment.LRN.section || '', 40, yPosition);
    } else {
      doc.setFont(undefined, 'bold');
      doc.text('LRN:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(payment.LRN || 'N/A', 40, yPosition);
    }
    
    // Payment Details Section
    yPosition += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(headerSize);
    doc.text('Payment Details:', 20, yPosition);
    
    yPosition += 7;
    doc.setFontSize(normalSize);
    
    doc.setFont(undefined, 'bold');
    doc.text('Type:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.payment_type, 60, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Description:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.description, 60, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Amount Paid:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrency(payment.amount), 60, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Payment Method:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.payment_method, 60, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text('School Year:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.school_year, 60, yPosition);
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Status After Payment:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.status_after_payment, 60, yPosition);
    
    if (payment.total_amount !== undefined) {
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Total Amount:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(formatCurrency(payment.total_amount), 60, yPosition);
    }
    
    if (payment.balance_after_payment !== undefined) {
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Balance After Payment:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(formatCurrency(payment.balance_after_payment), 60, yPosition);
    }
    
    // Additional Information
    yPosition += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Processed By:', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.processed_by, 60, yPosition);
    
    if (payment.remarks) {
      yPosition += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Remarks:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(payment.remarks, 60, yPosition);
    }
    
    // Footer
    yPosition += 20;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    
    yPosition += 7;
    doc.setFontSize(smallSize);
    doc.setFont(undefined, 'italic');
    doc.text('This is an official receipt from SCSA', 105, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text(`Generated on: ${new Date().toLocaleString('en-US')}`, 105, yPosition, { align: 'center' });
    
    // Save the PDF
    doc.save(`Receipt_${payment.receipt_number}.pdf`);
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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Ensure filteredPayments is an array before slicing
  const safeFilteredPayments = Array.isArray(filteredPayments) ? filteredPayments : [];
  const currentPayments = safeFilteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeFilteredPayments.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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

        {/* Alert */}
        {error && (
          <div className="ph-alert ph-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
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
                    <option value="">All Sections</option>
                    <option value="Virgen Del Rosario">Virgen Del Rosario</option>
                    <option value="Virgen Del Pilar">Virgen Del Pilar</option>
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

            <div className="ph-filter-group">
              <label>Payment Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="ph-card">
          <div className="ph-list-header">
            <h2>
              Payment Records
              <span className="ph-count">
                ({safeFilteredPayments.length} {safeFilteredPayments.length === 1 ? 'payment' : 'payments'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="ph-loading">Loading payment history...</div>
          ) : safeFilteredPayments.length === 0 ? (
            <div className="ph-no-data">
              <Receipt size={48} />
              <p>No payment records found</p>
            </div>
          ) : (
            <>
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
                      <th>Amount Paid</th>
                      <th>Balance After</th>
                      <th>Status</th>
                      <th>Payment Method</th>
                      <th>Payment Date</th>
                      <th>School Year</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.map((payment) => (
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
                        <td className="ph-balance">
                          {payment.balance_after_payment !== undefined 
                            ? formatCurrency(payment.balance_after_payment) 
                            : '-'}
                        </td>
                        <td>
                          <span className={`ph-status-badge ph-status-${payment.status_after_payment?.toLowerCase().replace(' ', '-')}`}>
                            {payment.status_after_payment}
                          </span>
                        </td>
                        <td>{payment.payment_method}</td>
                        <td>{formatDate(payment.payment_date)}</td>
                        <td>{payment.school_year}</td>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="ph-pagination">
                  <button 
                    className="ph-pagination-btn"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  
                  <div className="ph-pagination-pages">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            className={`ph-pagination-page ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => goToPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="ph-pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    className="ph-pagination-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;