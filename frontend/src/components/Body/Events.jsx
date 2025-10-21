import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Trash2, Plus, AlertCircle, CheckCircle, X, DollarSign, Users, FileText, Check, Undo2, Search } from 'lucide-react';
import './Events.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Section-Strand combinations from registration
const SECTION_STRAND_COMBINATIONS = [
  { section: 'Virgen Del Rosario', strand: 'STEM' },
  { section: 'Virgen Del Pilar', strand: 'STEM' },
  { section: 'Virgen Del Carmen', strand: 'ABM' },
  { section: 'Virgen Del Carmen', strand: 'HUMSS' }
];

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filters, setFilters] = useState({
    status: '',
    event_type: '',
    pricing_model: ''
  });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [selectedEventForPayment, setSelectedEventForPayment] = useState(null);
  const [selectedEventForBreakdown, setSelectedEventForBreakdown] = useState(null);

  // Form data - Updated pricing model (removed 'fixed' and 'split', keeping only 'per_student' and 'section')
  const [formData, setFormData] = useState({
    event_name: '',
    event_type: '',
    event_date: '',
    payment_deadline: '',
    description: '',
    pricing_model: 'per_student',
    target_sections: [],
    total_amount: '',
    has_breakdown: false
  });

  // Breakdown items
  const [breakdownItems, setBreakdownItems] = useState([]);
  const [newBreakdownItem, setNewBreakdownItem] = useState({ item_name: '', amount: '' });

  // Payment data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [paymentFilters, setPaymentFilters] = useState({
    LRN: '',
    lastname: '',
    gradelevel: '',
    section: '',
    strand: '',
    payment_status: ''
  });

  // Exemption data
  const [exemptedStudents, setExemptedStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState({
    LRN: '',
    lastname: '',
    gradelevel: '',
    section: '',
    strand: ''
  });
  const [allStudentsForExemption, setAllStudentsForExemption] = useState([]);

  const isAdmin = user?.role === 'admin';

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? `${API_URL}/events` 
        : `${API_URL}/events/student/${user.LRN}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError('Failed to fetch events: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.LRN]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/students`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    if (isAdmin) {
      fetchStudents();
    }
  }, [fetchEvents, fetchStudents, isAdmin]);

  const applyFilters = useCallback(() => {
    let filtered = [...events];

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.event_type) {
      filtered = filtered.filter(e => e.event_type === filters.event_type);
    }

    if (filters.pricing_model) {
      filtered = filtered.filter(e => e.pricing_model === filters.pricing_model);
    }

    setFilteredEvents(filtered);
  }, [events, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      event_type: '',
      pricing_model: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Reset breakdown when has_breakdown changes
      if (name === 'has_breakdown') {
        const hasBreakdown = value === 'true';
        updated.has_breakdown = hasBreakdown;
        if (!hasBreakdown) {
          setBreakdownItems([]);
        }
      }
      
      return updated;
    });
  };

  const handleSectionStrandToggle = (combination) => {
    setFormData(prev => {
      const key = `${combination.section}-${combination.strand}`;
      const exists = prev.target_sections.some(
        ts => ts.section === combination.section && ts.strand === combination.strand
      );
      
      const sections = exists
        ? prev.target_sections.filter(ts => !(ts.section === combination.section && ts.strand === combination.strand))
        : [...prev.target_sections, combination];
      
      return { ...prev, target_sections: sections };
    });
  };

  const handleAddNew = () => {
    setFormData({
      event_name: '',
      event_type: '',
      event_date: '',
      payment_deadline: '',
      description: '',
      pricing_model: 'per_student',
      target_sections: [],
      total_amount: '',
      has_breakdown: false
    });
    setBreakdownItems([]);
    setExemptedStudents([]);
    setAllStudentsForExemption(students);
    setShowModal(true);
  };

  const addBreakdownItem = () => {
    if (newBreakdownItem.item_name && newBreakdownItem.amount) {
      setBreakdownItems([...breakdownItems, { ...newBreakdownItem, amount: parseFloat(newBreakdownItem.amount) }]);
      setNewBreakdownItem({ item_name: '', amount: '' });
    }
  };

  const removeBreakdownItem = (index) => {
    setBreakdownItems(breakdownItems.filter((_, i) => i !== index));
  };

  const calculateTotalBreakdown = () => {
    return breakdownItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const handleExemptToggle = (studentLRN) => {
    setExemptedStudents(prev => {
      if (prev.includes(studentLRN)) {
        return prev.filter(lrn => lrn !== studentLRN);
      } else {
        return [...prev, studentLRN];
      }
    });
  };

  const applyStudentFilters = useCallback(() => {
    let filtered = [...students];

    if (studentFilters.LRN) {
      filtered = filtered.filter(s => s.LRN.toLowerCase().includes(studentFilters.LRN.toLowerCase()));
    }
    if (studentFilters.lastname) {
      filtered = filtered.filter(s => s.lastname.toLowerCase().includes(studentFilters.lastname.toLowerCase()));
    }
    if (studentFilters.gradelevel) {
      filtered = filtered.filter(s => s.gradelevel === studentFilters.gradelevel);
    }
    if (studentFilters.section) {
      filtered = filtered.filter(s => s.section === studentFilters.section);
    }
    if (studentFilters.strand) {
      filtered = filtered.filter(s => s.strand === studentFilters.strand);
    }

    setAllStudentsForExemption(filtered);
  }, [students, studentFilters]);

  useEffect(() => {
    if (showModal) {
      applyStudentFilters();
    }
  }, [showModal, applyStudentFilters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for per_student model
    if (formData.pricing_model === 'per_student') {
      if (!formData.total_amount) {
        setError('Please enter the total amount');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (formData.has_breakdown && breakdownItems.length === 0) {
        setError('Please add at least one breakdown item');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // If has breakdown, validate that total breakdown equals total amount
      if (formData.has_breakdown) {
        const breakdownTotal = calculateTotalBreakdown();
        const enteredTotal = parseFloat(formData.total_amount);
        if (Math.abs(breakdownTotal - enteredTotal) > 0.01) {
          setError('Breakdown total must equal the total amount');
          setTimeout(() => setError(''), 3000);
          return;
        }
      }
    }
    
    // Validation for section model
    if (formData.pricing_model === 'section') {
      if (formData.target_sections.length === 0) {
        setError('Please select at least one section-strand combination');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (!formData.total_amount) {
        setError('Please enter the amount per section');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      if (formData.has_breakdown && breakdownItems.length === 0) {
        setError('Please add at least one breakdown item');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // If has breakdown, validate that total breakdown equals amount per section
      if (formData.has_breakdown) {
        const breakdownTotal = calculateTotalBreakdown();
        const enteredAmount = parseFloat(formData.total_amount);
        if (Math.abs(breakdownTotal - enteredAmount) > 0.01) {
          setError('Breakdown total must equal the amount per section');
          setTimeout(() => setError(''), 3000);
          return;
        }
      }
    }

    try {
      let totalAmount;
      let amountPerStudent;
      let totalExpected;
      
      if (formData.pricing_model === 'per_student') {
        amountPerStudent = parseFloat(formData.total_amount);
        const nonExemptedCount = students.length - exemptedStudents.length;
        totalExpected = amountPerStudent * nonExemptedCount;
      } else { // section
        amountPerStudent = parseFloat(formData.total_amount);
        totalExpected = amountPerStudent * formData.target_sections.length;
      }

      const eventData = {
        ...formData,
        breakdown: formData.has_breakdown ? breakdownItems : [],
        total_amount: totalExpected,
        amount_per_student: amountPerStudent,
        total_students: students.length,
        exempted_students: exemptedStudents
      };

      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) throw new Error('Failed to save event');
      
      setSuccess('Event created successfully');
      fetchEvents();
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save event');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleMarkAsDone = async (event) => {
    try {
      const response = await fetch(`${API_URL}/events/${event._id}/mark-done`, {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('Failed to mark event as done');
      
      setSuccess('Event marked as completed successfully');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to mark event as done');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUnmarkAsDone = async (event) => {
    try {
      const response = await fetch(`${API_URL}/events/${event._id}/unmark-done`, {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('Failed to unmark event');
      
      setSuccess('Event unmarked successfully');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unmark event');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${eventToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete event');
      
      setSuccess('Event deleted successfully');
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete event');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openBreakdownModal = (event) => {
    setSelectedEventForBreakdown(event);
    setShowBreakdownModal(true);
  };

  const openPaymentModal = async (event) => {
    setSelectedEventForPayment(event);
    
    try {
      const response = await fetch(`${API_URL}/events/${event._id}/payments`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const payments = await response.json();
      
      if (event.pricing_model === 'section') {
        // For section-based payment, show sections with strand
        const sectionsWithPayments = event.target_sections.map(targetSection => {
          const sectionPayment = event.section_payments?.find(
            sp => sp.section === targetSection.section && sp.strand === targetSection.strand
          );
          const studentsInSection = students.filter(
            s => s.section === targetSection.section && s.strand === targetSection.strand
          );
          
          return {
            section: targetSection.section,
            strand: targetSection.strand,
            payment_status: sectionPayment ? sectionPayment.status : 'Unpaid',
            payment_date: sectionPayment ? sectionPayment.payment_date : null,
            payment_id: sectionPayment ? sectionPayment._id : null,
            amount: event.amount_per_student,
            student_count: studentsInSection.length
          };
        });
        
        setSections(sectionsWithPayments);
      } else {
        // For per_student pricing, show students
        const studentsWithPayments = students.map(student => {
          const payment = payments.find(p => p.student_id === student.LRN);
          return {
            ...student,
            payment_status: payment ? payment.status : 'Unpaid',
            payment_date: payment ? payment.payment_date : null,
            payment_id: payment ? payment._id : null,
            is_exempted: payment ? payment.is_exempted : false,
            actual_amount: payment ? payment.actual_amount : event.amount_per_student
          };
        });
        
        setFilteredStudents(studentsWithPayments);
      }
      
      setShowPaymentModal(true);
    } catch (err) {
      setError('Failed to load payment data');
      console.error(err);
    }
  };

  const applyPaymentFilters = useCallback(() => {
    if (!selectedEventForPayment) return;
    
    if (selectedEventForPayment.pricing_model === 'section') {
      return;
    }
    
    let filtered = students.map(student => {
      const payment = selectedEventForPayment?.payments?.find(p => p.student_id === student.LRN);
      return {
        ...student,
        payment_status: payment ? payment.status : 'Unpaid',
        payment_date: payment ? payment.payment_date : null,
        payment_id: payment ? payment._id : null,
        is_exempted: payment ? payment.is_exempted : false,
        actual_amount: payment ? payment.actual_amount : selectedEventForPayment.amount_per_student
      };
    });

    if (paymentFilters.LRN) {
      filtered = filtered.filter(s => s.LRN.toLowerCase().includes(paymentFilters.LRN.toLowerCase()));
    }
    if (paymentFilters.lastname) {
      filtered = filtered.filter(s => s.lastname.toLowerCase().includes(paymentFilters.lastname.toLowerCase()));
    }
    if (paymentFilters.gradelevel) {
      filtered = filtered.filter(s => s.gradelevel === paymentFilters.gradelevel);
    }
    if (paymentFilters.section) {
      filtered = filtered.filter(s => s.section === paymentFilters.section);
    }
    if (paymentFilters.strand) {
      filtered = filtered.filter(s => s.strand === paymentFilters.strand);
    }
    if (paymentFilters.payment_status) {
      filtered = filtered.filter(s => s.payment_status === paymentFilters.payment_status);
    }

    setFilteredStudents(filtered);
  }, [students, selectedEventForPayment, paymentFilters]);

  useEffect(() => {
    if (showPaymentModal && selectedEventForPayment?.pricing_model !== 'section') {
      applyPaymentFilters();
    }
  }, [showPaymentModal, applyPaymentFilters, selectedEventForPayment]);

  const handleSectionPaymentStatusChange = async (section, strand, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/events/${selectedEventForPayment._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: section,
          strand: strand,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update section payment');

      setSuccess('Section payment updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchEvents();
      
      const events = await fetch(`${API_URL}/events`).then(r => r.json());
      const updatedEvent = events.find(e => e._id === selectedEventForPayment._id);
      if (updatedEvent) {
        openPaymentModal(updatedEvent);
      }
    } catch (err) {
      setError('Failed to update section payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePaymentStatusChange = async (studentLRN, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/events/${selectedEventForPayment._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentLRN,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update payment');

      setSuccess('Payment updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchEvents();
      
      const events = await fetch(`${API_URL}/events`).then(r => r.json());
      const updatedEvent = events.find(e => e._id === selectedEventForPayment._id);
      if (updatedEvent) {
        openPaymentModal(updatedEvent);
      }
    } catch (err) {
      setError('Failed to update payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculateEventStats = (event) => {
    if (!event.payments && !event.section_payments) return { 
      totalPaid: 0, 
      totalStudents: 0, 
      paidCount: 0, 
      totalExpected: 0, 
      exemptedCount: 0, 
      nonExemptedCount: 0
    };
    
    const exemptedCount = event.payments?.filter(p => p.is_exempted).length || 0;
    
    if (event.pricing_model === 'section') {
      const sectionStudents = students.filter(s => 
        event.target_sections.some(ts => ts.section === s.section && ts.strand === s.strand)
      );
      const paidSections = event.section_payments?.filter(sp => sp.status === 'Paid') || [];
      const totalPaid = paidSections.reduce((sum, sp) => sum + sp.amount, 0);
      const totalExpected = event.target_sections.length * event.amount_per_student;
      const paidCount = paidSections.length;
      
      return { 
        totalPaid, 
        totalStudents: sectionStudents.length, 
        paidCount, 
        totalExpected, 
        exemptedCount, 
        nonExemptedCount: event.target_sections.length
      };
    } else {
      const nonExemptedCount = event.payments.filter(p => !p.is_exempted).length;
      const paidPayments = event.payments.filter(p => p.status === 'Paid' && !p.is_exempted);
      const totalPaid = paidPayments.length * event.amount_per_student;
      const totalExpected = nonExemptedCount * event.amount_per_student;
      const paidCount = paidPayments.length;
      
      return { 
        totalPaid, 
        totalStudents: event.total_students, 
        paidCount, 
        totalExpected, 
        exemptedCount, 
        nonExemptedCount
      };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPricingModelLabel = (model) => {
    switch(model) {
      case 'per_student': return 'Per Student';
      case 'section': return 'Per Section';
      default: return model;
    }
  };

  return (
    <div className="wrapper">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="title">
                <Calendar size={32} />
                Events & Contributions
              </h1>
              <p className="subtitle">Track school events and contribution payments</p>
            </div>
            {isAdmin && (
              <button className="add-btn" onClick={handleAddNew}>
                <Plus size={20} />
                Add Event
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-header">
            <h2 className="filters-title">
              <Filter size={20} />
              Filter Events
            </h2>
            <button className="clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="label">Event Type</label>
              <select className="input" name="event_type" value={filters.event_type} onChange={handleFilterChange}>
                <option value="">All Event Types</option>
                <option value="Foundation Day">Foundation Day</option>
                <option value="Field Trip">Field Trip</option>
                <option value="Sports Fest">Sports Fest</option>
                <option value="Christmas Party">Christmas Party</option>
                <option value="Graduation">Graduation</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="label">Status</label>
              <select className="input" name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="label">Pricing Model</label>
              <select className="input" name="pricing_model" value={filters.pricing_model} onChange={handleFilterChange}>
                <option value="">All Pricing Models</option>
                <option value="per_student">Per Student</option>
                <option value="section">Per Section</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="card">
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="no-data">
              <Calendar size={48} />
              <p>No events found</p>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const stats = calculateEventStats(event);
                const isCompleted = event.status === 'Completed';
                const isExempted = !isAdmin && event.student_payment?.is_exempted;
                
                return (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3 className="event-name">{event.event_name}</h3>
                      <div className="status-badges">
                        <span className={`status status-${event.status}`}>
                          {event.status}
                        </span>
                        {isExempted && (
                          <span className="status status-exempted">
                            Exempted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="event-type">
                      <FileText size={16} />
                      {event.event_type}
                    </div>

                    <div className="pricing-model-badge">
                      {getPricingModelLabel(event.pricing_model)}
                    </div>
                    
                    {event.pricing_model === 'section' && event.target_sections && (
                      <div className="target-sections">
                        <strong>Sections:</strong>
                        {event.target_sections.map((ts, idx) => (
                          <span key={idx} className="section-badge">
                            {ts.section} ({ts.strand})
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-dates">
                      <div className="date-item">
                        <Calendar size={16} />
                        <div>
                          <span className="date-label">Event Date</span>
                          <span className="date-value">{formatDate(event.event_date)}</span>
                        </div>
                      </div>
                      <div className="date-item">
                        <DollarSign size={16} />
                        <div>
                          <span className="date-label">Payment Deadline</span>
                          <span className="date-value">{formatDate(event.payment_deadline)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="event-stats">
                      {event.pricing_model === 'section' ? (
                        <>
                          <div className="stat-item">
                            <span className="stat-label">Amount per Section</span>
                            <span className="stat-value">{formatCurrency(event.amount_per_student)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Total Sections</span>
                            <span className="stat-value">{event.target_sections?.length || 0}</span>
                          </div>
                          {!isAdmin && event.student_payment && (
                            <div className="stat-item">
                              <span className="stat-label">Your Status</span>
                              <span className={`stat-value ${event.student_payment.status === 'Paid' ? 'text-green' : 'text-red'}`}>
                                {event.student_payment.is_exempted ? 'Exempted' : event.student_payment.status}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="stat-item">
                            <span className="stat-label">Amount per Student</span>
                            <span className="stat-value">{formatCurrency(event.amount_per_student)}</span>
                          </div>
                          {!isAdmin && event.student_payment && (
                            <div className="stat-item">
                              <span className="stat-label">Your Status</span>
                              <span className={`stat-value ${event.student_payment.status === 'Paid' ? 'text-green' : 'text-red'}`}>
                                {event.student_payment.is_exempted ? 'Exempted' : event.student_payment.status}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {isAdmin && (
                        <>
                          <div className="stat-item">
                            <span className="stat-label">Total Expected</span>
                            <span className="stat-value">{formatCurrency(stats.totalExpected)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Total Collected</span>
                            <span className="stat-value">{formatCurrency(stats.totalPaid)}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">
                              {event.pricing_model === 'section' ? 'Sections Paid' : 'Students Paid'}
                            </span>
                            <span className="stat-value">{stats.paidCount} / {stats.nonExemptedCount}</span>
                          </div>
                          {stats.exemptedCount > 0 && (
                            <div className="stat-item">
                              <span className="stat-label">Exempted</span>
                              <span className="stat-value">{stats.exemptedCount}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {isAdmin && (
                      <div className="event-actions">
                        {!isCompleted && (
                          <>
                            <button className="view-btn" onClick={() => openPaymentModal(event)}>
                              <Users size={16} />
                              Manage Payments
                            </button>
                            <button className="done-btn" onClick={() => handleMarkAsDone(event)}>
                              <Check size={16} />
                              Mark Done
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(event)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <button className="unmark-btn" onClick={() => handleUnmarkAsDone(event)}>
                            <Undo2 size={16} />
                            Unmark Done
                          </button>
                        )}
                      </div>
                    )}

                    {!isAdmin && event.breakdown && event.breakdown.length > 0 && (
                      <div className="event-actions">
                        <button className="view-breakdown-btn" onClick={() => openBreakdownModal(event)}>
                          <FileText size={16} />
                          View Breakdown
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Event Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal modal-large modal-scrollable">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Add Event</h3>
                  <p className="modal-warning">⚠️ Event cannot be edited once created</p>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="label">Event Name *</label>
                    <input
                      className="input"
                      type="text"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Event Type *</label>
                    <select
                      className="input"
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Event Type</option>
                      <option value="Foundation Day">Foundation Day</option>
                      <option value="Field Trip">Field Trip</option>
                      <option value="Sports Fest">Sports Fest</option>
                      <option value="Christmas Party">Christmas Party</option>
                      <option value="Graduation">Graduation</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Pricing Model *</label>
                    <select
                      className="input"
                      name="pricing_model"
                      value={formData.pricing_model}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="per_student">Per Student</option>
                      <option value="section">Per Section</option>
                    </select>
                    <small className="form-hint">
                      {formData.pricing_model === 'per_student' && 'Each student pays the specified amount'}
                      {formData.pricing_model === 'section' && 'Payment is per section-strand combination'}
                    </small>
                  </div>

                  {formData.pricing_model === 'section' && (
                    <div className="form-group">
                      <label className="label">Target Section-Strand Combinations *</label>
                      <div className="checkbox-group">
                        {SECTION_STRAND_COMBINATIONS.map((combo, idx) => {
                          const key = `${combo.section}-${combo.strand}`;
                          const isChecked = formData.target_sections.some(
                            ts => ts.section === combo.section && ts.strand === combo.strand
                          );
                          return (
                            <label key={idx} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSectionStrandToggle(combo)}
                              />
                              {combo.section} - {combo.strand}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">
                      {formData.pricing_model === 'per_student' ? 'Amount per Student *' : 'Amount per Section *'}
                    </label>
                    <input
                      className="input"
                      type="number"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Add Breakdown?</label>
                    <select
                      className="input"
                      name="has_breakdown"
                      value={formData.has_breakdown.toString()}
                      onChange={handleInputChange}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                    <small className="form-hint">
                      Optional: Add itemized breakdown for transparency
                    </small>
                  </div>

                  {formData.has_breakdown && (
                    <div className="breakdown-section">
                      <h4 className="breakdown-title">Event Breakdown</h4>
                      
                      <div className="breakdown-add">
                        <input
                          className="input"
                          type="text"
                          placeholder="Item name (e.g., Snacks, Venue)"
                          value={newBreakdownItem.item_name}
                          onChange={(e) => setNewBreakdownItem({...newBreakdownItem, item_name: e.target.value})}
                        />
                        <input
                          className="input"
                          type="number"
                          placeholder="Amount"
                          step="0.01"
                          value={newBreakdownItem.amount}
                          onChange={(e) => setNewBreakdownItem({...newBreakdownItem, amount: e.target.value})}
                        />
                        <button type="button" className="add-breakdown-btn" onClick={addBreakdownItem}>
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="breakdown-list">
                        {breakdownItems.map((item, index) => (
                          <div key={index} className="breakdown-item">
                            <span className="breakdown-item-name">{item.item_name}</span>
                            <span className="breakdown-item-amount">{formatCurrency(item.amount)}</span>
                            <button type="button" className="remove-breakdown-btn" onClick={() => removeBreakdownItem(index)}>
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {breakdownItems.length > 0 && (
                        <>
                          <div className="breakdown-total">
                            <span>Breakdown Total:</span>
                            <span className="total-amount">{formatCurrency(calculateTotalBreakdown())}</span>
                          </div>
                          <div className="breakdown-validation">
                            {formData.total_amount && (
                              Math.abs(calculateTotalBreakdown() - parseFloat(formData.total_amount)) < 0.01 ? (
                                <span className="validation-success">✓ Breakdown matches the entered amount</span>
                              ) : (
                                <span className="validation-error">⚠ Breakdown must equal the entered amount</span>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Event Date *</label>
                      <input
                        className="input"
                        type="date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Payment Deadline *</label>
                      <input
                        className="input"
                        type="date"
                        name="payment_deadline"
                        value={formData.payment_deadline}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Description</label>
                    <textarea
                      className="input"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  {formData.pricing_model === 'per_student' && (
                    <div className="exemption-section">
                      <h4 className="exemption-title">
                        <Users size={18} />
                        Student Exemptions
                      </h4>
                      <p className="exemption-subtitle">
                        Select students to exempt from payment ({exemptedStudents.length} exempted)
                        {exemptedStudents.length > 0 && formData.total_amount && (
                          <span className="exemption-info">
                            {' '}- Total: {formatCurrency(parseFloat(formData.total_amount) * (students.length - exemptedStudents.length))}
                          </span>
                        )}
                      </p>

                      <div className="student-filters">
                        <input
                          className="filter-input"
                          type="text"
                          placeholder="Search LRN"
                          value={studentFilters.LRN}
                          onChange={(e) => setStudentFilters({...studentFilters, LRN: e.target.value})}
                        />
                        <input
                          className="filter-input"
                          type="text"
                          placeholder="Search Last Name"
                          value={studentFilters.lastname}
                          onChange={(e) => setStudentFilters({...studentFilters, lastname: e.target.value})}
                        />
                        <select
                          className="filter-input"
                          value={studentFilters.gradelevel}
                          onChange={(e) => setStudentFilters({...studentFilters, gradelevel: e.target.value})}
                        >
                          <option value="">All Grade Levels</option>
                          <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                        <select
                          className="filter-input"
                          value={studentFilters.section}
                          onChange={(e) => setStudentFilters({...studentFilters, section: e.target.value})}
                        >
                          <option value="">All Sections</option>
                          <option value="Virgen Del Rosario">Virgen Del Rosario</option>
                          <option value="Virgen Del Pilar">Virgen Del Pilar</option>
                          <option value="Virgen Del Carmen">Virgen Del Carmen</option>
                        </select>
                        <select
                          className="filter-input"
                          value={studentFilters.strand}
                          onChange={(e) => setStudentFilters({...studentFilters, strand: e.target.value})}
                        >
                          <option value="">All Strands</option>
                          <option value="STEM">STEM</option>
                          <option value="ABM">ABM</option>
                          <option value="HUMSS">HUMSS</option>
                        </select>
                      </div>

                      <div className="student-exemption-list">
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th className="th">Exempt</th>
                                <th className="th">LRN</th>
                                <th className="th">Name</th>
                                <th className="th">Grade Level</th>
                                <th className="th">Section</th>
                                <th className="th">Strand</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allStudentsForExemption.map((student) => (
                                <tr key={student.LRN} className={exemptedStudents.includes(student.LRN) ? 'exempted-row' : ''}>
                                  <td className="td">
                                    <input
                                      type="checkbox"
                                      checked={exemptedStudents.includes(student.LRN)}
                                      onChange={() => handleExemptToggle(student.LRN)}
                                      className="exempt-checkbox"
                                    />
                                  </td>
                                  <td className="td">{student.LRN}</td>
                                  <td className="td">
                                    {student.firstname} {student.middlename} {student.lastname}
                                  </td>
                                  <td className="td">{student.gradelevel}</td>
                                  <td className="td">{student.section}</td>
                                  <td className="td">{student.strand}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">Confirm Delete</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the event "{eventToDelete?.event_name}"?</p>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={handleDeleteConfirm}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breakdown Modal */}
        {showBreakdownModal && selectedEventForBreakdown && (
          <div className="modal-overlay">
            <div className="modal modal-scrollable">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Event Breakdown - {selectedEventForBreakdown.event_name}</h3>
                  <p className="modal-subtitle">
                    Pricing Model: {getPricingModelLabel(selectedEventForBreakdown.pricing_model)}
                  </p>
                </div>
                <button className="close-btn" onClick={() => setShowBreakdownModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {selectedEventForBreakdown.breakdown && selectedEventForBreakdown.breakdown.length > 0 ? (
                  <>
                    <div className="breakdown-list">
                      {selectedEventForBreakdown.breakdown.map((item, index) => (
                        <div key={index} className="breakdown-item">
                          <span className="breakdown-item-name">{item.item_name}</span>
                          <span className="breakdown-item-amount">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="breakdown-total">
                      <span>Total Amount:</span>
                      <span className="total-amount">
                        {formatCurrency(selectedEventForBreakdown.pricing_model === 'section' 
                          ? selectedEventForBreakdown.amount_per_student 
                          : selectedEventForBreakdown.breakdown.reduce((sum, item) => sum + item.amount, 0)
                        )}
                      </span>
                    </div>
                    {selectedEventForBreakdown.pricing_model === 'per_student' && (
                      <div className="per-student-amount" style={{marginTop: '1rem'}}>
                        <span>Amount per Student:</span>
                        <span className="per-student-value">{formatCurrency(selectedEventForBreakdown.amount_per_student)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p>No breakdown available for this event.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Management Modal */}
        {showPaymentModal && selectedEventForPayment && (
          <div className="modal-overlay">
            <div className="modal modal-large modal-scrollable">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Manage Payments - {selectedEventForPayment.event_name}</h3>
                  <p className="modal-subtitle">
                    Pricing Model: {getPricingModelLabel(selectedEventForPayment.pricing_model)} | 
                    {selectedEventForPayment.pricing_model === 'section' 
                      ? ` Amount per Section: ${formatCurrency(selectedEventForPayment.amount_per_student)}`
                      : ` Amount per Student: ${formatCurrency(selectedEventForPayment.amount_per_student)}`}
                  </p>
                </div>
                <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {selectedEventForPayment.pricing_model === 'section' ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="th">Section</th>
                          <th className="th">Strand</th>
                          <th className="th">Students</th>
                          <th className="th">Amount</th>
                          <th className="th">Status</th>
                          <th className="th">Payment Date</th>
                          <th className="th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((sectionData, idx) => (
                          <tr key={idx}>
                            <td className="td">{sectionData.section}</td>
                            <td className="td">{sectionData.strand}</td>
                            <td className="td">{sectionData.student_count}</td>
                            <td className="td">{formatCurrency(sectionData.amount)}</td>
                            <td className="td">
                              <span className={`status status-${sectionData.payment_status}`}>
                                {sectionData.payment_status}
                              </span>
                            </td>
                            <td className="td">
                              {sectionData.payment_date 
                                ? formatDate(sectionData.payment_date)
                                : '-'
                              }
                            </td>
                            <td className="td">
                              <select
                                className="status-select"
                                value={sectionData.payment_status}
                                onChange={(e) => handleSectionPaymentStatusChange(sectionData.section, sectionData.strand, e.target.value)}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <div className="payment-filters">
                      <input
                        className="filter-input"
                        type="text"
                        placeholder="Search LRN"
                        value={paymentFilters.LRN}
                        onChange={(e) => setPaymentFilters({...paymentFilters, LRN: e.target.value})}
                      />
                      <input
                        className="filter-input"
                        type="text"
                        placeholder="Search Last Name"
                        value={paymentFilters.lastname}
                        onChange={(e) => setPaymentFilters({...paymentFilters, lastname: e.target.value})}
                      />
                      <select
                        className="filter-input"
                        value={paymentFilters.gradelevel}
                        onChange={(e) => setPaymentFilters({...paymentFilters, gradelevel: e.target.value})}
                      >
                        <option value="">All Grade Levels</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                      <select
                        className="filter-input"
                        value={paymentFilters.section}
                        onChange={(e) => setPaymentFilters({...paymentFilters, section: e.target.value})}
                      >
                        <option value="">All Sections</option>
                        <option value="Virgen Del Rosario">Virgen Del Rosario</option>
                        <option value="Virgen Del Pilar">Virgen Del Pilar</option>
                        <option value="Virgen Del Carmen">Virgen Del Carmen</option>
                      </select>
                      <select
                        className="filter-input"
                        value={paymentFilters.strand}
                        onChange={(e) => setPaymentFilters({...paymentFilters, strand: e.target.value})}
                      >
                        <option value="">All Strands</option>
                        <option value="STEM">STEM</option>
                        <option value="ABM">ABM</option>
                        <option value="HUMSS">HUMSS</option>
                      </select>
                      <select
                        className="filter-input"
                        value={paymentFilters.payment_status}
                        onChange={(e) => setPaymentFilters({...paymentFilters, payment_status: e.target.value})}
                      >
                        <option value="">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="th">LRN</th>
                            <th className="th">Name</th>
                            <th className="th">Grade Level</th>
                            <th className="th">Section</th>
                            <th className="th">Strand</th>
                            <th className="th">Amount</th>
                            <th className="th">Status</th>
                            <th className="th">Payment Date</th>
                            <th className="th">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student.LRN} className={student.is_exempted ? 'exempted-row' : ''}>
                              <td className="td">{student.LRN}</td>
                              <td className="td">
                                {student.firstname} {student.middlename} {student.lastname}
                                {student.is_exempted && (
                                  <span className="exempted-badge">Exempted</span>
                                )}
                              </td>
                              <td className="td">{student.gradelevel}</td>
                              <td className="td">{student.section}</td>
                              <td className="td">{student.strand}</td>
                              <td className="td">
                                {student.is_exempted 
                                  ? formatCurrency(0) 
                                  : formatCurrency(student.actual_amount)
                                }
                              </td>
                              <td className="td">
                                <span className={`status status-${student.payment_status}`}>
                                  {student.is_exempted ? 'Exempted' : student.payment_status}
                                </span>
                              </td>
                              <td className="td">
                                {student.payment_date 
                                  ? formatDate(student.payment_date)
                                  : '-'
                                }
                              </td>
                              <td className="td">
                                {!student.is_exempted && (
                                  <select
                                    className="status-select"
                                    value={student.payment_status}
                                    onChange={(e) => handlePaymentStatusChange(student.LRN, e.target.value)}
                                  >
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Paid">Paid</option>
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;