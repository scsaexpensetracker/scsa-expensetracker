import express from 'express';
import TuitionFee from '../models/TuitionFee.js';
import User from '../models/User.js';

const router = express.Router();

// Get all tuition fees with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, status, school_year } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (status) filter.status = status;
    if (school_year) filter.school_year = school_year;

    const tuitionFees = await TuitionFee.find(filter).populate('LRN', 'firstname middlename lastname gradelevel section');
    res.json(tuitionFees);
  } catch (error) {
    console.error('Error fetching tuition fees:', error);
    res.status(500).json({ message: 'Server error fetching tuition fees' });
  }
});

// Get tuition fee by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const tuitionFees = await TuitionFee.find({ LRN: req.params.lrn });
    res.json(tuitionFees);
  } catch (error) {
    console.error('Error fetching tuition fee:', error);
    res.status(500).json({ message: 'Server error fetching tuition fee' });
  }
});

// Create new tuition fee
router.post('/', async (req, res) => {
  try {
    const { LRN, school_year, total_amount, amount_paid, due_date, status } = req.body;

    // Check if student exists
    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const balance = total_amount - amount_paid;

    const newTuitionFee = await TuitionFee.create({
      LRN,
      school_year,
      total_amount,
      amount_paid,
      balance,
      due_date,
      status: status || (balance === 0 ? 'Paid' : balance < total_amount ? 'Partially Paid' : 'Unpaid')
    });

    res.status(201).json({
      message: 'Tuition fee record created successfully',
      tuitionFee: newTuitionFee
    });
  } catch (error) {
    console.error('Error creating tuition fee:', error);
    res.status(500).json({ message: 'Server error creating tuition fee' });
  }
});

// Update tuition fee
router.put('/:id', async (req, res) => {
  try {
    const { total_amount, amount_paid, due_date, status, school_year } = req.body;
    
    const balance = total_amount - amount_paid;
    
    const tuitionFee = await TuitionFee.findByIdAndUpdate(
      req.params.id,
      {
        total_amount,
        amount_paid,
        balance,
        due_date,
        status: status || (balance === 0 ? 'Paid' : balance < total_amount ? 'Partially Paid' : 'Unpaid'),
        school_year
      },
      { new: true, runValidators: true }
    );

    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    res.json({
      message: 'Tuition fee updated successfully',
      tuitionFee
    });
  } catch (error) {
    console.error('Error updating tuition fee:', error);
    res.status(500).json({ message: 'Server error updating tuition fee' });
  }
});

// Add payment to tuition fee
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, payment_date, receipt_number, payment_method, remarks } = req.body;

    const tuitionFee = await TuitionFee.findById(req.params.id);
    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    tuitionFee.payment_history.push({
      amount,
      payment_date: payment_date || new Date(),
      receipt_number,
      payment_method,
      remarks
    });

    tuitionFee.amount_paid += amount;
    tuitionFee.balance = tuitionFee.total_amount - tuitionFee.amount_paid;
    
    if (tuitionFee.balance === 0) {
      tuitionFee.status = 'Paid';
    } else if (tuitionFee.balance < tuitionFee.total_amount) {
      tuitionFee.status = 'Partially Paid';
    }

    await tuitionFee.save();

    res.json({
      message: 'Payment added successfully',
      tuitionFee
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ message: 'Server error adding payment' });
  }
});

// Delete tuition fee
router.delete('/:id', async (req, res) => {
  try {
    const tuitionFee = await TuitionFee.findByIdAndDelete(req.params.id);
    
    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    res.json({ message: 'Tuition fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting tuition fee:', error);
    res.status(500).json({ message: 'Server error deleting tuition fee' });
  }
});

export default router;