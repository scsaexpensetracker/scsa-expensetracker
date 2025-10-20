import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import axios from 'axios';
import './UniformBooks.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UniformsBooks = ({ user }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    LRN: '',
    item_type: '',
    status: '',
    school_year: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    LRN: '',
    item_type: '',
    item_name: '',
    quantity: '',
    unit_price: '',
    amount_paid: '',
    school_year: '',
    status: 'Unpaid'
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url = isAdmin 
        ? `${API_URL}/uniforms-books` 
        : `${API_URL}/uniforms-books/student/${user.LRN}`;
      const response = await axios.get(url);
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (filters.LRN && isAdmin) {
      filtered = filtered.filter(i => 
        (i.LRN?.LRN || i.LRN)?.toLowerCase().includes(filters.LRN.toLowerCase())
      );
    }

    if (filters.item_type) {
      filtered = filtered.filter(i => i.item_type === filters.item_type);
    }

    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }

    if (filters.school_year) {
      filtered = filtered.filter(i => i.school_year === filters.school_year);
    }

    setFilteredItems(filtered);
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
      item_type: '',
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

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormData({
      LRN: '',
      item_type: '',
      item_name: '',
      quantity: '',
      unit_price: '',
      amount_paid: '',
      school_year: '',
      status: 'Unpaid'
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      LRN: item.LRN?.LRN || item.LRN,
      item_type: item.item_type,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount_paid: item.amount_paid,
      school_year: item.school_year,
      status: item.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await axios.put(`${API_URL}/uniforms-books/${currentItem._id}`, formData);
        setSuccess('Item updated successfully');
      } else {
        await axios.post(`${API_URL}/uniforms-books`, formData);
        setSuccess('Item created successfully');
      }
      fetchItems();
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/uniforms-books/${itemToDelete._id}`);
      setSuccess('Item deleted successfully');
      fetchItems();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'ub-status-paid';
      case 'Partially Paid': return 'ub-status-partial';
      case 'Unpaid': return 'ub-status-unpaid';
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
    <div className="ub-wrapper">
      <div className="ub-container">
        {/* Header */}
        <div className="ub-header">
          <div className="ub-header-content">
            <div className="ub-header-text">
              <h1>
                <ShoppingBag size={32} />
                Uniforms & Books
              </h1>
              <p>Manage uniforms, books, and school materials</p>
            </div>
            {isAdmin && (
              <button className="ub-add-btn" onClick={handleAddNew}>
                <Plus size={20} />
                Add Item
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="ub-alert ub-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="ub-alert ub-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="ub-filters-card">
          <div className="ub-filters-header">
            <h2>
              <Filter size={20} />
              Filter Items
            </h2>
            <button className="ub-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          <div className="ub-filters-grid">
            {isAdmin && (
              <div className="ub-filter-group">
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

            <div className="ub-filter-group">
              <label>Item Type</label>
              <select name="item_type" value={filters.item_type} onChange={handleFilterChange}>
                <option value="">All Item Types</option>
                <option value="Uniform">Uniform</option>
                <option value="Book">Book</option>
                <option value="Laboratory Materials">Laboratory Materials</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="ub-filter-group">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="ub-filter-group">
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

        {/* Items List */}
        <div className="ub-card">
          <div className="ub-list-header">
            <h2>
              Items List
              <span className="ub-count">
                ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="ub-loading">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="ub-no-data">
              <ShoppingBag size={48} />
              <p>No items found</p>
            </div>
          ) : (
            <div className="ub-table-container">
              <table className="ub-table">
                <thead>
                  <tr>
                    {isAdmin && <th>LRN</th>}
                    {isAdmin && <th>Student Name</th>}
                    <th>Item Type</th>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Amount Paid</th>
                    <th>Balance</th>
                    <th>School Year</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item._id}>
                      {isAdmin && <td>{item.LRN?.LRN || item.LRN}</td>}
                      {isAdmin && (
                        <td>
                          {item.LRN?.firstname} {item.LRN?.middlename} {item.LRN?.lastname}
                        </td>
                      )}
                      <td>{item.item_type}</td>
                      <td>{item.item_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.total_amount)}</td>
                      <td>{formatCurrency(item.amount_paid)}</td>
                      <td className="ub-balance">{formatCurrency(item.balance)}</td>
                      <td>{item.school_year}</td>
                      <td>
                        <span className={`ub-status ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {isAdmin && (
                          <div className="ub-action-buttons">
                            <button
                              className="ub-action-btn ub-action-btn-edit"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="ub-action-btn ub-action-btn-delete"
                              onClick={() => handleDeleteClick(item)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
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
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <div className="ub-modal-header">
                <h3>{currentItem ? 'Edit Item' : 'Add Item'}</h3>
                <button className="ub-modal-close" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="ub-modal-body">
                <div className="ub-form-group">
                  <label>LRN *</label>
                  <input
                    type="text"
                    name="LRN"
                    value={formData.LRN}
                    onChange={handleInputChange}
                    required
                    disabled={currentItem}
                  />
                </div>

                <div className="ub-form-group">
                  <label>Item Type *</label>
                  <select
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Item Type</option>
                    <option value="Uniform">Uniform</option>
                    <option value="Book">Book</option>
                    <option value="Laboratory Materials">Laboratory Materials</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="ub-form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="ub-form-row">
                  <div className="ub-form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="ub-form-group">
                    <label>Unit Price *</label>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="ub-form-group">
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

                <div className="ub-form-group">
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

                <div className="ub-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
              <div className="ub-modal-actions">
                <button
                  type="button"
                  className="ub-modal-btn ub-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ub-modal-btn ub-modal-btn-save" onClick={handleSubmit}>
                  {currentItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <div className="ub-modal-header">
                <h3>Confirm Delete</h3>
                <button className="ub-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="ub-modal-body">
                <p>Are you sure you want to delete this item?</p>
                <p className="ub-modal-warning">This action cannot be undone.</p>
              </div>
              <div className="ub-modal-actions">
                <button
                  className="ub-modal-btn ub-modal-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="ub-modal-btn ub-modal-btn-delete"
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

export default UniformsBooks;