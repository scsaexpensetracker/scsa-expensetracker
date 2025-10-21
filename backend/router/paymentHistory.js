import express from 'express';
import TuitionFee from '../models/TuitionFee.js';
import UniformBook from '../models/UniformBook.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to aggregate all payments
const aggregatePayments = async (lrn = null) => {
  const allPayments = [];

  // 1. Get Tuition Fee Payments
  const tuitionFilter = lrn ? { LRN: lrn } : {};
  const tuitionFees = await TuitionFee.find(tuitionFilter).lean();
  
  for (const tuition of tuitionFees) {
    const student = await User.findOne({ LRN: tuition.LRN })
      .select('LRN firstname middlename lastname gradelevel section strand');
    
    // Add each payment from payment_history array
    if (tuition.payment_history && tuition.payment_history.length > 0) {
      tuition.payment_history.forEach(payment => {
        // Determine status based on balance after payment
        let paymentStatus = 'Paid';
        if (payment.balance_after_payment > 0) {
          paymentStatus = 'Partially Paid';
        }
        
        allPayments.push({
          _id: payment._id,
          receipt_number: payment.receipt_number || 'N/A',
          LRN: student || { LRN: tuition.LRN },
          payment_type: 'Tuition Fee',
          description: `${tuition.semester} - ${tuition.school_year}`,
          amount: payment.amount,
          payment_method: payment.payment_method || 'N/A',
          payment_date: payment.payment_date,
          school_year: tuition.school_year,
          processed_by: 'System',
          remarks: payment.remarks || '',
          balance_after_payment: payment.balance_after_payment,
          total_amount: tuition.total_amount,
          status_after_payment: paymentStatus,
          source: 'tuition'
        });
      });
    }
  }

  // 2. Get Uniform/Book Purchases (treating purchases as payments)
  const uniformFilter = lrn ? { LRN: lrn } : {};
  const uniforms = await UniformBook.find(uniformFilter).lean();
  
  for (const uniform of uniforms) {
    const student = await User.findOne({ LRN: uniform.LRN })
      .select('LRN firstname middlename lastname gradelevel section strand');
    
    // Only include if there's an amount paid
    if (uniform.amount_paid > 0) {
      // Create description from items
      const itemsList = uniform.items.map(item => 
        `${item.item_name} (${item.quantity})`
      ).join(', ');
      
      // Determine status
      let paymentStatus = uniform.status; // Use the status from schema
      
      allPayments.push({
        _id: uniform._id,
        receipt_number: `UB-${uniform._id.toString().slice(-8)}`,
        LRN: student || { LRN: uniform.LRN },
        payment_type: uniform.items[0]?.item_type || 'Others',
        description: itemsList,
        amount: uniform.amount_paid,
        payment_method: 'N/A',
        payment_date: uniform.purchase_date,
        school_year: uniform.school_year,
        processed_by: 'System',
        remarks: `Status: ${uniform.status}`,
        balance_after_payment: uniform.balance,
        total_amount: uniform.total_amount,
        status_after_payment: paymentStatus,
        source: 'uniform'
      });
    }
  }

  // 3. Get Event Payments
  const events = await Event.find().lean();
  
  for (const event of events) {
    // For per_student pricing model
    if (event.pricing_model === 'per_student' && event.payments) {
      for (const payment of event.payments) {
        // Skip if not paid or if filtering by LRN and doesn't match
        if (payment.status !== 'Paid') continue;
        if (lrn && payment.student_id !== lrn) continue;
        
        const student = await User.findOne({ LRN: payment.student_id })
          .select('LRN firstname middlename lastname gradelevel section strand');
        
        if (student || !lrn) {
          allPayments.push({
            _id: payment._id,
            receipt_number: `EV-${payment._id.toString().slice(-8)}`,
            LRN: student || { LRN: payment.student_id },
            payment_type: 'Event Contribution',
            description: `${event.event_name} - ${event.event_type}`,
            amount: payment.actual_amount || event.amount_per_student,
            payment_method: 'N/A',
            payment_date: payment.payment_date,
            school_year: new Date(event.event_date).getFullYear().toString(),
            processed_by: 'System',
            remarks: payment.is_exempted ? 'Exempted' : '',
            balance_after_payment: 0,
            total_amount: payment.actual_amount || event.amount_per_student,
            status_after_payment: 'Paid',
            source: 'event'
          });
        }
      }
    }
    
    // For section pricing model
    if (event.pricing_model === 'section' && event.section_payments) {
      for (const sectionPayment of event.section_payments) {
        if (sectionPayment.status !== 'Paid') continue;
        
        // If filtering by LRN, check if student belongs to this section
        if (lrn) {
          const student = await User.findOne({ LRN: lrn });
          if (!student || student.section !== sectionPayment.section || student.strand !== sectionPayment.strand) {
            continue;
          }
        }
        
        allPayments.push({
          _id: sectionPayment._id,
          receipt_number: `EVS-${sectionPayment._id.toString().slice(-8)}`,
          LRN: lrn ? await User.findOne({ LRN: lrn }).select('LRN firstname middlename lastname gradelevel section strand') : 
               { LRN: `${sectionPayment.section} - ${sectionPayment.strand}` },
          payment_type: 'Event Contribution',
          description: `${event.event_name} - ${event.event_type} (Section Payment)`,
          amount: sectionPayment.amount,
          payment_method: 'N/A',
          payment_date: sectionPayment.payment_date,
          school_year: new Date(event.event_date).getFullYear().toString(),
          processed_by: 'System',
          remarks: `${sectionPayment.section} - ${sectionPayment.strand}`,
          balance_after_payment: 0,
          total_amount: sectionPayment.amount,
          status_after_payment: 'Paid',
          source: 'event_section'
        });
      }
    }
  }

  // Sort by payment date (newest first)
  allPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  
  return allPayments;
};

// Get all payment history (Admin only)
router.get('/', async (req, res) => {
  try {
    const payments = await aggregatePayments();
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

// Get payment history by student LRN (Student access)
router.get('/student/:lrn', async (req, res) => {
  try {
    const payments = await aggregatePayments(req.params.lrn);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

export default router;