import express from 'express';
import TuitionFee from '../models/TuitionFee.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to recalculate payment history balances
const recalculateBalances = (tuitionFee) => {
  let runningBalance = tuitionFee.total_amount;
  
  // Sort payment history by payment_date
  tuitionFee.payment_history.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
  
  // Recalculate balance after each payment
  tuitionFee.payment_history.forEach(payment => {
    runningBalance -= payment.amount;
    payment.balance_after_payment = Math.max(0, runningBalance);
  });
  
  // Update total amount_paid and balance
  tuitionFee.amount_paid = tuitionFee.payment_history.reduce((sum, payment) => sum + payment.amount, 0);
  tuitionFee.balance = Math.max(0, tuitionFee.total_amount - tuitionFee.amount_paid);
  
  // Update status
  if (tuitionFee.balance === 0) {
    tuitionFee.status = 'Paid';
  } else if (tuitionFee.balance < tuitionFee.total_amount && tuitionFee.balance > 0) {
    tuitionFee.status = 'Partially Paid';
  } else {
    tuitionFee.status = 'Unpaid';
  }
};

// Get all tuition fees with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, status, school_year, semester } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (status) filter.status = status;
    if (school_year) filter.school_year = school_year;
    if (semester) filter.semester = semester;

    const tuitionFees = await TuitionFee.find(filter).lean();
    
    // Manually populate student information
    const populatedFees = await Promise.all(
      tuitionFees.map(async (fee) => {
        const student = await User.findOne({ LRN: fee.LRN }).select('LRN firstname middlename lastname gradelevel section').lean();
        return {
          ...fee,
          studentInfo: student
        };
      })
    );
    
    res.json(populatedFees);
  } catch (error) {
    console.error('Error fetching tuition fees:', error);
    res.status(500).json({ message: 'Server error fetching tuition fees' });
  }
});

// Get tuition fee by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const tuitionFees = await TuitionFee.find({ LRN: req.params.lrn }).lean();
    
    // Manually populate student information
    const populatedFees = await Promise.all(
      tuitionFees.map(async (fee) => {
        const student = await User.findOne({ LRN: fee.LRN }).select('LRN firstname middlename lastname gradelevel section').lean();
        return {
          ...fee,
          studentInfo: student
        };
      })
    );
    
    res.json(populatedFees);
  } catch (error) {
    console.error('Error fetching tuition fee:', error);
    res.status(500).json({ message: 'Server error fetching tuition fee' });
  }
});

// Create new tuition fee
router.post('/', async (req, res) => {
  try {
    const { LRN, school_year, semester, total_amount, amount_paid, due_date, status } = req.body;

    // Check if student exists
    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if tuition fee already exists for this student, school year, and semester
    const existingTuition = await TuitionFee.findOne({ LRN, school_year, semester });
    if (existingTuition) {
      return res.status(400).json({ 
        message: `Tuition fee for ${semester} of ${school_year} already exists for this student` 
      });
    }

    const paidAmount = amount_paid || 0;
    const balance = total_amount - paidAmount;

    const newTuitionFee = new TuitionFee({
      LRN,
      school_year,
      semester,
      total_amount,
      amount_paid: paidAmount,
      balance,
      due_date,
      status: status || (balance === 0 ? 'Paid' : balance < total_amount && paidAmount > 0 ? 'Partially Paid' : 'Unpaid'),
      payment_history: []
    });

    // If initial payment is provided, add it to payment history
    if (paidAmount > 0) {
      newTuitionFee.payment_history.push({
        amount: paidAmount,
        payment_date: new Date(),
        receipt_number: '',
        payment_method: '',
        remarks: 'Initial payment',
        balance_after_payment: balance
      });
    }

    await newTuitionFee.save();

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
    const { total_amount, due_date, school_year, semester } = req.body;
    
    const tuitionFee = await TuitionFee.findById(req.params.id);
    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    // Check if semester/school year combination already exists for another record
    if (semester && school_year) {
      const existingTuition = await TuitionFee.findOne({ 
        LRN: tuitionFee.LRN, 
        school_year, 
        semester,
        _id: { $ne: req.params.id }
      });
      if (existingTuition) {
        return res.status(400).json({ 
          message: `Tuition fee for ${semester} of ${school_year} already exists for this student` 
        });
      }
    }

    if (total_amount) tuitionFee.total_amount = total_amount;
    if (due_date) tuitionFee.due_date = due_date;
    if (school_year) tuitionFee.school_year = school_year;
    if (semester) tuitionFee.semester = semester;

    // Recalculate all balances
    recalculateBalances(tuitionFee);

    await tuitionFee.save();

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

    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    if (amount > tuitionFee.balance) {
      return res.status(400).json({ 
        message: `Payment amount (₱${amount.toLocaleString()}) exceeds balance (₱${tuitionFee.balance.toLocaleString()})` 
      });
    }

    // Add new payment
    tuitionFee.payment_history.push({
      amount,
      payment_date: payment_date || new Date(),
      receipt_number,
      payment_method,
      remarks,
      balance_after_payment: 0 // Will be recalculated
    });

    // Recalculate all balances
    recalculateBalances(tuitionFee);

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

// Update a specific payment
router.put('/:id/payment/:paymentId', async (req, res) => {
  try {
    const { amount, payment_date, receipt_number, payment_method, remarks } = req.body;

    const tuitionFee = await TuitionFee.findById(req.params.id);
    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    const payment = tuitionFee.payment_history.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Update payment fields
    if (amount !== undefined) payment.amount = amount;
    if (payment_date) payment.payment_date = payment_date;
    if (receipt_number !== undefined) payment.receipt_number = receipt_number;
    if (payment_method !== undefined) payment.payment_method = payment_method;
    if (remarks !== undefined) payment.remarks = remarks;

    // Recalculate all balances
    recalculateBalances(tuitionFee);

    await tuitionFee.save();

    res.json({
      message: 'Payment updated successfully',
      tuitionFee
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error updating payment' });
  }
});

// Delete a specific payment
router.delete('/:id/payment/:paymentId', async (req, res) => {
  try {
    const tuitionFee = await TuitionFee.findById(req.params.id);
    if (!tuitionFee) {
      return res.status(404).json({ message: 'Tuition fee record not found' });
    }

    const payment = tuitionFee.payment_history.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Remove the payment
    payment.deleteOne();

    // Recalculate all balances
    recalculateBalances(tuitionFee);

    await tuitionFee.save();

    res.json({
      message: 'Payment deleted successfully',
      tuitionFee
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error deleting payment' });
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