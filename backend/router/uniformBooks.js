import express from 'express';
import UniformBook from '../models/UniformBook.js';
import Catalog from '../models/Catalog.js';
import User from '../models/User.js';

const router = express.Router();

// ========== CATALOG ROUTES (Admin) ==========

// Get all catalog items
router.get('/catalog', async (req, res) => {
  try {
    const { item_type, school_year, grade_level, strand, section } = req.query;
    
    let filter = { is_active: true };
    
    if (item_type) filter.item_type = item_type;
    if (school_year) filter.school_year = school_year;
    if (grade_level) filter.grade_level = { $in: [grade_level, 'Both', ''] };
    if (strand) filter.strand = { $in: [strand, 'All', ''] };
    if (section) filter.section = { $in: [section, 'All', ''] };

    const items = await Catalog.find(filter).sort({ item_name: 1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ message: 'Server error fetching catalog' });
  }
});

// Create catalog item
router.post('/catalog', async (req, res) => {
  try {
    const newItem = await Catalog.create(req.body);
    res.status(201).json({
      message: 'Catalog item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error creating catalog item:', error);
    res.status(500).json({ message: 'Server error creating catalog item' });
  }
});

// Update catalog item
router.put('/catalog/:id', async (req, res) => {
  try {
    const item = await Catalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }

    res.json({
      message: 'Catalog item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating catalog item:', error);
    res.status(500).json({ message: 'Server error updating catalog item' });
  }
});

// Delete catalog item
router.delete('/catalog/:id', async (req, res) => {
  try {
    const item = await Catalog.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Catalog item not found' });
    }

    res.json({ message: 'Catalog item deleted successfully' });
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    res.status(500).json({ message: 'Server error deleting catalog item' });
  }
});

// ========== PURCHASE ORDERS ROUTES ==========

router.get('/', async (req, res) => {
  try {
    const { LRN, status, school_year } = req.query;
    let filter = {};
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (status) filter.status = status;
    if (school_year) filter.school_year = school_year;
    const orders = await UniformBook.find(filter)
      .populate({
        path: 'LRN',
        model: 'User',
        select: 'firstname middlename lastname gradelevel section strand',
        match: { LRN: { $exists: true } }, // Optional: Ensures LRN exists in User
        localField: 'LRN',
        foreignField: 'LRN' // Match UniformBook.LRN with User.LRN
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Get orders by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const orders = await UniformBook.find({ LRN: req.params.lrn })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Check if student has purchased a specific book
router.get('/check-book/:lrn/:bookName', async (req, res) => {
  try {
    const { lrn, bookName } = req.params;
    const { school_year } = req.query;
    
    const existingPurchase = await UniformBook.findOne({
      LRN: lrn,
      school_year: school_year,
      'items.item_type': 'Book',
      'items.item_name': bookName
    });
    
    res.json({ hasPurchased: !!existingPurchase });
  } catch (error) {
    console.error('Error checking book purchase:', error);
    res.status(500).json({ message: 'Server error checking book purchase' });
  }
});

// Create new purchase order
router.post('/', async (req, res) => {
  try {
    const { LRN, items, school_year, amount_paid } = req.body;

    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const paid = amount_paid || 0;
    const balance = total_amount - paid;

    const newOrder = await UniformBook.create({
      LRN,
      items,
      total_amount,
      amount_paid: paid,
      balance,
      school_year,
      status: balance === 0 ? 'Paid' : balance < total_amount ? 'Partially Paid' : 'Unpaid'
    });

    res.status(201).json({
      message: 'Purchase order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
});

// Update purchase order (Admin - payment update)
router.put('/:id', async (req, res) => {
  try {
    const { amount_paid, status } = req.body;
    
    const order = await UniformBook.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const newAmountPaid = amount_paid !== undefined ? amount_paid : order.amount_paid;
    const balance = order.total_amount - newAmountPaid;
    
    const updatedOrder = await UniformBook.findByIdAndUpdate(
      req.params.id,
      {
        amount_paid: newAmountPaid,
        balance,
        status: status || (balance === 0 ? 'Paid' : balance < order.total_amount ? 'Partially Paid' : 'Unpaid')
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error updating order' });
  }
});

// Delete purchase order
router.delete('/:id', async (req, res) => {
  try {
    const order = await UniformBook.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error deleting order' });
  }
});

export default router;