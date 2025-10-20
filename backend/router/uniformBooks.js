import express from 'express';
import UniformBook from '../models/UniformBook.js';
import User from '../models/User.js';

const router = express.Router();

// Get all uniforms/books with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, item_type, status, school_year } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (item_type) filter.item_type = item_type;
    if (status) filter.status = status;
    if (school_year) filter.school_year = school_year;

    const items = await UniformBook.find(filter).populate('LRN', 'firstname middlename lastname gradelevel section');
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// Get items by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const items = await UniformBook.find({ LRN: req.params.lrn });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// Create new item
router.post('/', async (req, res) => {
  try {
    const { LRN, item_type, item_name, quantity, unit_price, amount_paid, school_year } = req.body;

    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const total_amount = quantity * unit_price;
    const balance = total_amount - (amount_paid || 0);

    const newItem = await UniformBook.create({
      LRN,
      item_type,
      item_name,
      quantity,
      unit_price,
      total_amount,
      amount_paid: amount_paid || 0,
      balance,
      school_year,
      status: balance === 0 ? 'Paid' : balance < total_amount ? 'Partially Paid' : 'Unpaid'
    });

    res.status(201).json({
      message: 'Item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Server error creating item' });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { item_type, item_name, quantity, unit_price, amount_paid, school_year, status } = req.body;
    
    const total_amount = quantity * unit_price;
    const balance = total_amount - amount_paid;
    
    const item = await UniformBook.findByIdAndUpdate(
      req.params.id,
      {
        item_type,
        item_name,
        quantity,
        unit_price,
        total_amount,
        amount_paid,
        balance,
        school_year,
        status: status || (balance === 0 ? 'Paid' : balance < total_amount ? 'Partially Paid' : 'Unpaid')
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await UniformBook.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

export default router;