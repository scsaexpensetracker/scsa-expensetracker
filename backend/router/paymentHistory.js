import express from 'express';
import PaymentHistory from '../models/PaymentHistory.js';
import User from '../models/User.js';

const router = express.Router();

// Get all payment history with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, payment_type, payment_method, school_year, start_date, end_date } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (payment_type) filter.payment_type = payment_type;
    if (payment_method) filter.payment_method = payment_method;
    if (school_year) filter.school_year = school_year;
    
    if (start_date || end_date) {
      filter.payment_date = {};
      if (start_date) filter.payment_date.$gte = new Date(start_date);
      if (end_date) filter.payment_date.$lte = new Date(end_date);
    }

    const payments = await PaymentHistory.find(filter)
      .populate('LRN', 'firstname middlename lastname gradelevel section')
      .sort({ payment_date: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

// Get payment history by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ LRN: req.params.lrn })
      .sort({ payment_date: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

// Get payment statistics
router.get('/stats/:lrn', async (req, res) => {
  try {
    const payments = await PaymentHistory.find({ LRN: req.params.lrn });
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentCount = payments.length;
    
    const paymentsByType = payments.reduce((acc, payment) => {
      acc[payment.payment_type] = (acc[payment.payment_type] || 0) + payment.amount;
      return acc;
    }, {});

    res.json({
      totalAmount,
      paymentCount,
      paymentsByType
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ message: 'Server error fetching payment statistics' });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const { 
      LRN, 
      payment_type, 
      description, 
      amount, 
      payment_method, 
      receipt_number, 
      payment_date,
      school_year, 
      processed_by, 
      remarks 
    } = req.body;

    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if receipt number already exists
    const existingReceipt = await PaymentHistory.findOne({ receipt_number });
    if (existingReceipt) {
      return res.status(400).json({ message: 'Receipt number already exists' });
    }

    const newPayment = await PaymentHistory.create({
      LRN,
      payment_type,
      description,
      amount,
      payment_method,
      receipt_number,
      payment_date: payment_date || Date.now(),
      school_year,
      processed_by,
      remarks: remarks || ''
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: newPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: error.message || 'Server error creating payment' });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const { 
      payment_type, 
      description, 
      amount, 
      payment_method, 
      receipt_number,
      payment_date, 
      school_year, 
      processed_by, 
      remarks 
    } = req.body;
    
    const payment = await PaymentHistory.findByIdAndUpdate(
      req.params.id,
      {
        payment_type,
        description,
        amount,
        payment_method,
        receipt_number,
        payment_date,
        school_year,
        processed_by,
        remarks
      },
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error updating payment' });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await PaymentHistory.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error deleting payment' });
  }
});

export default router;