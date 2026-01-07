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
  X,
  ShoppingCart,
  Minus,
  Book,
  Shirt,
  Package,
  Eye
} from 'lucide-react';
import axios from 'axios';
import './UniformBooks.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UniformsBooks = ({ user }) => {
  const isAdmin = user.role === 'admin';

  return isAdmin ? <AdminView user={user} /> : <StudentView user={user} />;
};

// ============= ADMIN VIEW =============
const AdminView = ({ user }) => {
  const [view, setView] = useState('catalog'); // 'catalog' or 'orders'
  const [catalogItems, setCatalogItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [catalogForm, setCatalogForm] = useState({
    item_type: '',
    item_name: '',
    description: '',
    price: '',
    grade_level: '',
    strand: '',
    school_year: '2024-2025'
  });

  const [orderFilters, setOrderFilters] = useState({
    LRN: '',
    status: '',
    school_year: ''
  });

  useEffect(() => {
    if (view === 'catalog') {
      fetchCatalog();
    } else {
      fetchOrders();
    }
  }, [view]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/uniforms-books/catalog`);
      setCatalogItems(response.data);
    } catch (err) {
      setError('Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (orderFilters.LRN) params.append('LRN', orderFilters.LRN);
      if (orderFilters.status) params.append('status', orderFilters.status);
      if (orderFilters.school_year) params.append('school_year', orderFilters.school_year);
      
      const response = await axios.get(`${API_URL}/uniforms-books/orders?${params}`);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await axios.put(`${API_URL}/uniforms-books/catalog/${currentItem._id}`, catalogForm);
        setSuccess('Catalog item updated successfully');
      } else {
        await axios.post(`${API_URL}/uniforms-books/catalog`, catalogForm);
        setSuccess('Catalog item created successfully');
      }
      fetchCatalog();
      setShowCatalogModal(false);
      resetCatalogForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save catalog item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCatalogItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await axios.delete(`${API_URL}/uniforms-books/catalog/${id}`);
      setSuccess('Catalog item deleted successfully');
      fetchCatalog();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete catalog item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/uniforms-books/${currentOrder._id}`, {
        amount_paid: currentOrder.amount_paid
      });
      setSuccess('Order updated successfully');
      fetchOrders();
      setShowOrderModal(false);
      setCurrentOrder(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await axios.delete(`${API_URL}/uniforms-books/${id}`);
      setSuccess('Order deleted successfully');
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetCatalogForm = () => {
    setCatalogForm({
      item_type: '',
      item_name: '',
      description: '',
      price: '',
      grade_level: '',
      strand: '',
      school_year: '2024-2025'
    });
    setCurrentItem(null);
  };

  const openCatalogModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setCatalogForm({
        item_type: item.item_type,
        item_name: item.item_name,
        description: item.description || '',
        price: item.price,
        grade_level: item.grade_level || '',
        strand: item.strand || '',
        school_year: item.school_year
      });
    } else {
      resetCatalogForm();
    }
    setShowCatalogModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'ub-status-paid';
      case 'Partially Paid': return 'ub-status-partial';
      case 'Unpaid': return 'ub-status-unpaid';
      default: return '';
    }
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
                Uniforms & Books Management
              </h1>
              <p>Manage catalog items and purchase orders</p>
            </div>
            <div className="ub-view-toggle">
              <button 
                className={view === 'catalog' ? 'active' : ''} 
                onClick={() => setView('catalog')}
              >
                <Package size={18} />
                Catalog
              </button>
              <button 
                className={view === 'orders' ? 'active' : ''} 
                onClick={() => setView('orders')}
              >
                <ShoppingCart size={18} />
                Orders
              </button>
            </div>
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

        {/* Catalog View */}
        {view === 'catalog' && (
          <>
            <div className="ub-card">
              <div className="ub-list-header">
                <h2>Catalog Items</h2>
                <button className="ub-add-btn" onClick={() => openCatalogModal()}>
                  <Plus size={20} />
                  Add Item
                </button>
              </div>

              {loading ? (
                <div className="ub-loading">Loading...</div>
              ) : (
                <div className="ub-catalog-grid">
                  {catalogItems.map(item => (
                    <div key={item._id} className="ub-catalog-card">
                      <div className="ub-catalog-icon">
                        {item.item_type === 'Uniform' && <Shirt size={24} />}
                        {item.item_type === 'Book' && <Book size={24} />}
                        {item.item_type === 'Others' && <Package size={24} />}
                      </div>
                      <div className="ub-catalog-info">
                        <h3>{item.item_name}</h3>
                        <p className="ub-catalog-type">{item.item_type}</p>
                        {item.description && <p className="ub-catalog-desc">{item.description}</p>}
                        {item.item_type === 'Book' && (
                          <p className="ub-catalog-assignment">
                            {item.grade_level || 'All'} - {item.strand || 'All'} - {item.section || 'All'}
                          </p>
                        )}
                        <p className="ub-catalog-price">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="ub-catalog-actions">
                        <button onClick={() => openCatalogModal(item)} className="ub-action-btn-edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteCatalogItem(item._id)} className="ub-action-btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Orders View */}
        {view === 'orders' && (
          <>
            <div className="ub-filters-card">
              <div className="ub-filters-grid">
                <div className="ub-filter-group">
                  <label>Search LRN</label>
                  <input
                    type="text"
                    value={orderFilters.LRN}
                    onChange={(e) => setOrderFilters({...orderFilters, LRN: e.target.value})}
                    placeholder="Enter LRN"
                  />
                </div>
                <div className="ub-filter-group">
                  <label>Status</label>
                  <select value={orderFilters.status} onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value})}>
                    <option value="">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div className="ub-filter-group">
                  <label>School Year</label>
                  <input
                    type="text"
                    value={orderFilters.school_year}
                    onChange={(e) => setOrderFilters({...orderFilters, school_year: e.target.value})}
                    placeholder="2024-2025"
                  />
                </div>
                <div className="ub-filter-group">
                  <button className="ub-filter-btn" onClick={fetchOrders}>
                    <Filter size={16} />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="ub-card">
              <div className="ub-list-header">
                <h2>Purchase Orders ({orders.length})</h2>
              </div>

              {loading ? (
                <div className="ub-loading">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="ub-no-data">
                  <ShoppingCart size={48} />
                  <p>No orders found</p>
                </div>
              ) : (
                <div className="ub-table-container">
                  <table className="ub-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>LRN</th>
                        <th>Student Name</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td>{new Date(order.purchase_date).toLocaleDateString()}</td>
                          <td>{order.LRN?.LRN || order.LRN}</td>
                          <td>
                            {order.LRN?.firstname} {order.LRN?.lastname}
                          </td>
                          <td>{order.items.length} items</td>
                          <td>{formatCurrency(order.total_amount)}</td>
                          <td>{formatCurrency(order.amount_paid)}</td>
                          <td className="ub-balance">{formatCurrency(order.balance)}</td>
                          <td>
                            <span className={`ub-status ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div className="ub-action-buttons">
                              <button 
                                className="ub-action-btn ub-action-btn-view"
                                onClick={() => {
                                  setCurrentOrder(order);
                                  setShowOrderModal(true);
                                }}
                                title="View/Edit"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                className="ub-action-btn ub-action-btn-delete"
                                onClick={() => handleDeleteOrder(order._id)}
                                title="Delete"
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
          </>
        )}

        {/* Catalog Modal */}
        {showCatalogModal && (
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <div className="ub-modal-header">
                <h3>{currentItem ? 'Edit Catalog Item' : 'Add Catalog Item'}</h3>
                <button className="ub-modal-close" onClick={() => setShowCatalogModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCatalogSubmit}>
                <div className="ub-modal-body">
                  <div className="ub-form-group">
                    <label>Item Type *</label>
                    <select
                      value={catalogForm.item_type}
                      onChange={(e) => setCatalogForm({...catalogForm, item_type: e.target.value})}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Uniform">Uniform</option>
                      <option value="Book">Book</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="ub-form-group">
                    <label>Item Name *</label>
                    <input
                      type="text"
                      value={catalogForm.item_name}
                      onChange={(e) => setCatalogForm({...catalogForm, item_name: e.target.value})}
                      placeholder="e.g., PE Uniform Shirt"
                      required
                    />
                  </div>

                  <div className="ub-form-group">
                    <label>Description {catalogForm.item_type === 'Uniform' && '(Size/Waistline) *'}</label>
                    <input
                      type="text"
                      value={catalogForm.description}
                      onChange={(e) => setCatalogForm({...catalogForm, description: e.target.value})}
                      placeholder={catalogForm.item_type === 'Uniform' ? 'e.g., Extra Small (XS)' : 'Item description'}
                      required={catalogForm.item_type === 'Uniform'}
                    />
                  </div>

                  <div className="ub-form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      value={catalogForm.price}
                      onChange={(e) => setCatalogForm({...catalogForm, price: e.target.value})}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {catalogForm.item_type === 'Book' && (
                    <>
                      <div className="ub-form-row">
                        <div className="ub-form-group">
                          <label>Grade Level</label>
                          <select
                            value={catalogForm.grade_level}
                            onChange={(e) => setCatalogForm({...catalogForm, grade_level: e.target.value})}
                          >
                            <option value="">All Grades</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>

                        <div className="ub-form-group">
                          <label>Strand</label>
                          <select
                            value={catalogForm.strand}
                            onChange={(e) => setCatalogForm({...catalogForm, strand: e.target.value})}
                          >
                            <option value="">All Strands</option>
                            <option value="STEM">STEM</option>
                            <option value="ABM">ABM</option>
                            <option value="HUMSS">HUMSS</option>
                            <option value="All">All</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="ub-form-group">
                    <label>School Year *</label>
                    <input
                      type="text"
                      value={catalogForm.school_year}
                      onChange={(e) => setCatalogForm({...catalogForm, school_year: e.target.value})}
                      placeholder="2024-2025"
                      required
                    />
                  </div>
                </div>
                <div className="ub-modal-actions">
                  <button type="button" className="ub-modal-btn ub-modal-btn-cancel" onClick={() => setShowCatalogModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ub-modal-btn ub-modal-btn-save">
                    {currentItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {showOrderModal && currentOrder && (
          <div className="ub-modal-overlay">
            <div className="ub-modal ub-modal-large">
              <div className="ub-modal-header">
                <h3>Order Details</h3>
                <button className="ub-modal-close" onClick={() => setShowOrderModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="ub-modal-body">
                <div className="ub-order-info">
                  <p><strong>LRN:</strong> {currentOrder.LRN?.LRN || currentOrder.LRN}</p>
                  <p><strong>Student:</strong> {currentOrder.LRN?.firstname} {currentOrder.LRN?.lastname}</p>
                  <p><strong>Date:</strong> {new Date(currentOrder.purchase_date).toLocaleDateString()}</p>
                  <p><strong>School Year:</strong> {currentOrder.school_year}</p>
                </div>

                <h4>Items Purchased</h4>
                <div className="ub-order-items">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="ub-order-item">
                      <div>
                        <p className="ub-item-name">{item.item_name}</p>
                        <p className="ub-item-desc">{item.description}</p>
                        <p className="ub-item-type">{item.item_type}</p>
                      </div>
                      <div className="ub-item-price">
                        <p>Qty: {item.quantity}</p>
                        <p>{formatCurrency(item.unit_price)} each</p>
                        <p><strong>{formatCurrency(item.subtotal)}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ub-order-summary">
                  <div className="ub-summary-row">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(currentOrder.total_amount)}</span>
                  </div>
                  <div className="ub-summary-row">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(currentOrder.amount_paid)}</span>
                  </div>
                  <div className="ub-summary-row ub-summary-balance">
                    <span>Balance:</span>
                    <span>{formatCurrency(currentOrder.balance)}</span>
                  </div>
                  <div className="ub-summary-row">
                    <span>Status:</span>
                    <span className={`ub-status ${getStatusClass(currentOrder.status)}`}>
                      {currentOrder.status}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUpdateOrder}>
                  <div className="ub-form-group">
                    <label>Update Payment Amount</label>
                    <input
                      type="number"
                      value={currentOrder.amount_paid}
                      onChange={(e) => setCurrentOrder({...currentOrder, amount_paid: parseFloat(e.target.value)})}
                      min="0"
                      max={currentOrder.total_amount}
                      step="0.01"
                    />
                  </div>
                  <div className="ub-modal-actions">
                    <button type="button" className="ub-modal-btn ub-modal-btn-cancel" onClick={() => setShowOrderModal(false)}>
                      Close
                    </button>
                    <button type="submit" className="ub-modal-btn ub-modal-btn-save">
                      Update Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= STUDENT VIEW =============
const StudentView = ({ user }) => {
  const [catalogItems, setCatalogItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' or 'history'
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [purchasedBooks, setPurchasedBooks] = useState(new Set());

  useEffect(() => {
    fetchCatalog();
    fetchPurchaseHistory();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        school_year: user.school_year,
        grade_level: user.gradelevel,
        strand: user.strand,
        section: user.section
      });
      const response = await axios.get(`${API_URL}/uniforms-books/catalog?${params}`);
      setCatalogItems(response.data);
    } catch (err) {
      setError('Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/uniforms-books/student/${user.LRN}`);
      setPurchaseHistory(response.data);
      
      // Extract purchased books
      const booksSet = new Set();
      response.data.forEach(order => {
        order.items.forEach(item => {
          if (item.item_type === 'Book') {
            booksSet.add(item.item_name);
          }
        });
      });
      setPurchasedBooks(booksSet);
    } catch (err) {
      console.error('Failed to fetch purchase history', err);
    }
  };

  const addToCart = (item, quantity = 1) => {
    const existingIndex = cart.findIndex(i => i._id === item._id);
    const bookQuantity = item.item_type === 'Book' ? 1 : quantity;
    
    if (existingIndex >= 0) {
      if (item.item_type !== 'Book') {
        const newCart = [...cart];
        newCart[existingIndex].quantity += quantity;
        setCart(newCart);
      }
    } else {
      setCart([...cart, { ...item, quantity: bookQuantity }]);
    }
    
    setSuccess(`${item.item_name} added to cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateCartQuantity = (itemId, change) => {
    const newCart = cart.map(item => {
      if (item._id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(newCart);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const toggleBookSelection = (bookName) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookName)) {
      newSelected.delete(bookName);
    } else {
      newSelected.add(bookName);
    }
    setSelectedBooks(newSelected);
  };

  const addSelectedBooksToCart = () => {
    const booksToAdd = catalogItems.filter(item => 
      item.item_type === 'Book' && selectedBooks.has(item.item_name)
    );
    
    const newBooks = booksToAdd.filter(book => !cart.find(item => item._id === book._id));
    
    if (newBooks.length > 0) {
      const updatedCart = [...cart, ...newBooks.map(book => ({ ...book, quantity: 1 }))];
      setCart(updatedCart);
    }
    
    setSelectedBooks(new Set());
    setSuccess(`${newBooks.length} books added to cart`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async (amountPaid) => {
    try {
      const orderData = {
        LRN: user.LRN,
        items: cart.map(item => ({
          item_type: item.item_type,
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity
        })),
        school_year: user.school_year,
      };

      await axios.post(`${API_URL}/uniforms-books`, orderData);
      setSuccess('Order placed successfully!');
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      fetchPurchaseHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'ub-status-paid';
      case 'Partially Paid': return 'ub-status-partial';
      case 'Unpaid': return 'ub-status-unpaid';
      default: return '';
    }
  };

  const uniformItems = catalogItems.filter(i => i.item_type === 'Uniform');
  const bookItems = catalogItems.filter(i => i.item_type === 'Book' && !purchasedBooks.has(i.item_name));
  const otherItems = catalogItems.filter(i => i.item_type === 'Others');

  return (
    <div className="ub-wrapper">
      <div className="ub-container">
        {/* Header */}
        <div className="ub-header">
          <div className="ub-header-content">
            <div className="ub-header-text">
              <h1>
                <ShoppingBag size={32} />
                Shop Uniforms & Books
              </h1>
              <p>Purchase uniforms, books, and other school materials</p>
            </div>
            <button className="ub-cart-btn" onClick={() => setShowCart(true)}>
              <ShoppingCart size={20} />
              Cart ({cart.length})
              {cart.length > 0 && <span className="ub-cart-badge">{cart.length}</span>}
            </button>
          </div>
          <div className="ub-student-tabs">
            <button 
              className={activeTab === 'shop' ? 'active' : ''} 
              onClick={() => setActiveTab('shop')}
            >
              <ShoppingBag size={18} />
              Shop
            </button>
            <button 
              className={activeTab === 'history' ? 'active' : ''} 
              onClick={() => setActiveTab('history')}
            >
              <Package size={18} />
              My Orders
            </button>
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

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <>
            {/* Uniforms Section */}
            <div className="ub-card">
              <div className="ub-section-header">
                <Shirt size={24} />
                <h2>Uniforms</h2>
              </div>
              {uniformItems.length === 0 ? (
                <p className="ub-no-items">No uniforms available</p>
              ) : (
                <div className="ub-catalog-grid">
                  {uniformItems.map(item => (
                    <div key={item._id} className="ub-catalog-card">
                      <div className="ub-catalog-icon">
                        <Shirt size={24} />
                      </div>
                      <div className="ub-catalog-info">
                        <h3>{item.item_name}</h3>
                        <p className="ub-catalog-desc">{item.description}</p>
                        <p className="ub-catalog-price">{formatCurrency(item.price)}</p>
                      </div>
                      <button 
                        className="ub-add-to-cart-btn"
                        onClick={() => addToCart(item)}
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Books Section */}
            <div className="ub-card">
              <div className="ub-section-header">
                <Book size={24} />
                <h2>Books</h2>
                {selectedBooks.size > 0 && (
                  <button 
                    className="ub-add-selected-btn"
                    onClick={addSelectedBooksToCart}
                  >
                    Add {selectedBooks.size} Selected to Cart
                  </button>
                )}
              </div>
              {bookItems.length === 0 ? (
                <p className="ub-no-items">No books available or all books already purchased</p>
              ) : (
                <div className="ub-books-list">
                  {bookItems.map(item => (
                    <div key={item._id} className="ub-book-item">
                      <input
                        type="checkbox"
                        checked={selectedBooks.has(item.item_name)}
                        onChange={() => toggleBookSelection(item.item_name)}
                        className="ub-book-checkbox"
                      />
                      <div className="ub-book-info">
                        <h4>{item.item_name}</h4>
                        {item.description && <p>{item.description}</p>}
                      </div>
                      <div className="ub-book-price">
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Others Section */}
            {otherItems.length > 0 && (
              <div className="ub-card">
                <div className="ub-section-header">
                  <Package size={24} />
                  <h2>Other Items</h2>
                </div>
                <div className="ub-catalog-grid">
                  {otherItems.map(item => (
                    <div key={item._id} className="ub-catalog-card">
                      <div className="ub-catalog-icon">
                        <Package size={24} />
                      </div>
                      <div className="ub-catalog-info">
                        <h3>{item.item_name}</h3>
                        {item.description && <p className="ub-catalog-desc">{item.description}</p>}
                        <p className="ub-catalog-price">{formatCurrency(item.price)}</p>
                      </div>
                      <button 
                        className="ub-add-to-cart-btn"
                        onClick={() => addToCart(item)}
                      >
                        <Plus size={16} />
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Purchase History Tab */}
        {activeTab === 'history' && (
          <div className="ub-card">
            <div className="ub-list-header">
              <h2>My Orders ({purchaseHistory.length})</h2>
            </div>
            {purchaseHistory.length === 0 ? (
              <div className="ub-no-data">
                <Package size={48} />
                <p>No purchase history</p>
              </div>
            ) : (
              <div className="ub-orders-list">
                {purchaseHistory.map(order => (
                  <div key={order._id} className="ub-history-card">
                    <div className="ub-history-header">
                      <div>
                        <p className="ub-history-date">
                          {new Date(order.purchase_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="ub-history-year">SY {order.school_year}</p>
                      </div>
                      <span className={`ub-status ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="ub-history-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="ub-history-item">
                          <span>{item.item_name}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ub-history-summary">
                      <div className="ub-history-row">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div className="ub-history-row">
                        <span>Paid:</span>
                        <span>{formatCurrency(order.amount_paid)}</span>
                      </div>
                      <div className="ub-history-row ub-history-balance">
                        <span>Balance:</span>
                        <span>{formatCurrency(order.balance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <div className="ub-cart-overlay" onClick={() => setShowCart(false)}>
            <div className="ub-cart-sidebar" onClick={(e) => e.stopPropagation()}>
              <div className="ub-cart-header">
                <h3>
                  <ShoppingCart size={20} />
                  Shopping Cart
                </h3>
                <button onClick={() => setShowCart(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="ub-cart-body">
                {cart.length === 0 ? (
                  <div className="ub-cart-empty">
                    <ShoppingCart size={48} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item._id} className="ub-cart-item">
                        <div className="ub-cart-item-info">
                          <h4>{item.item_name}</h4>
                          {item.description && <p>{item.description}</p>}
                          <p className="ub-cart-item-price">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="ub-cart-item-controls">
                          <div className="ub-quantity-control">
                            {item.item_type === 'Book' ? (
                              <span>{item.quantity}</span>
                            ) : (
                              <>
                                <button onClick={() => updateCartQuantity(item._id, -1)}>
                                  <Minus size={14} />
                                </button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateCartQuantity(item._id, 1)}>
                                  <Plus size={14} />
                                </button>
                              </>
                            )}
                          </div>
                          <p className="ub-cart-item-total">{formatCurrency(item.price * item.quantity)}</p>
                          <button 
                            className="ub-cart-remove"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {cart.length > 0 && (
                <div className="ub-cart-footer">
                  <div className="ub-cart-total">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <button 
                    className="ub-checkout-btn"
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <div className="ub-modal-header">
                <h3>Checkout</h3>
                <button className="ub-modal-close" onClick={() => setShowCheckout(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="ub-modal-body">
                <h4>Order Summary</h4>
                <div className="ub-checkout-items">
                  {cart.map(item => (
                    <div key={item._id} className="ub-checkout-item">
                      <span>{item.item_name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="ub-checkout-total">
                  <strong>Total Amount:</strong>
                  <strong>{formatCurrency(calculateTotal())}</strong>
                </div>
                <div className="ub-alert ub-alert-error">
                  <AlertCircle size={18} />
                  <span>Note: Only admins can delete orders. Make sure to double check before checking out items.</span>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckout();
                }}>
                  <div className="ub-modal-actions">
                    <button 
                      type="button" 
                      className="ub-modal-btn ub-modal-btn-cancel"
                      onClick={() => setShowCheckout(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="ub-modal-btn ub-modal-btn-save">
                      Place Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniformsBooks;