import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

// Get all events (Admin)
router.get('/', async (req, res) => {
  try {
    const { status, event_type } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (event_type) filter.event_type = event_type;

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Get events by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const student = await User.findOne({ LRN: req.params.lrn, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find all events
    const allEvents = await Event.find().sort({ createdAt: -1 });
    
    // Filter events that apply to this student or show if exempted
    const studentEvents = allEvents
      .map(event => {
        const studentPayment = event.payments.find(p => p.student_id === req.params.lrn);
        
        // For section-based events, check if student's section is included
        if (event.pricing_model === 'section') {
          const isInTargetSection = event.target_sections.some(
            ts => ts.section === student.section && ts.strand === student.strand
          );
          const sectionPayment = event.section_payments.find(
            sp => sp.section === student.section && sp.strand === student.strand
          );
          
          // Show event if student is in target section OR if student is exempted
          if (!isInTargetSection && !studentPayment?.is_exempted) {
            return null; // Don't show this event
          }
          
          return {
            ...event.toObject(),
            student_payment: studentPayment || { status: 'Unpaid', is_exempted: false },
            section_payment: sectionPayment
          };
        }
        
        // For fixed and split pricing, show all events
        return {
          ...event.toObject(),
          student_payment: studentPayment || { status: 'Unpaid', is_exempted: false }
        };
      })
      .filter(event => event !== null); // Remove nulls
    
    res.json(studentEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Get payments for a specific event
router.get('/:id/payments', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const { 
      event_name, 
      event_type, 
      event_date, 
      payment_deadline, 
      description,
      breakdown,
      total_amount,
      amount_per_student,
      pricing_model,
      target_sections,
      exempted_students
    } = req.body;

    let students = [];
    let payments = [];
    let sectionPayments = [];
    let calculatedAmountPerStudent = amount_per_student;

    if (pricing_model === 'section') {
      students = await User.find({ 
        role: 'student',
        $or: target_sections.map(ts => ({ 
          section: ts.section, 
          strand: ts.strand 
        }))
      });
      
      // Create section payments
      sectionPayments = target_sections.map(ts => ({
        section: ts.section,
        strand: ts.strand,
        status: 'Unpaid',
        amount: amount_per_student
      }));
      
      // Create individual student payments for tracking exemptions
      payments = students.map(student => ({
        student_id: student.LRN,
        status: 'Unpaid',
        is_exempted: exempted_students?.includes(student.LRN) || false,
        actual_amount: 0 // Not used for section-based
      }));
    } else {
      // For fixed and split pricing, get all students
      students = await User.find({ role: 'student' });
      
      // Calculate amount per student for split pricing
      if (pricing_model === 'split') {
        const nonExemptedCount = students.length - (exempted_students?.length || 0);
        calculatedAmountPerStudent = nonExemptedCount > 0 ? total_amount / nonExemptedCount : 0;
      }
      
      payments = students.map(student => {
        const isExempted = exempted_students?.includes(student.LRN) || false;
        return {
          student_id: student.LRN,
          status: 'Unpaid',
          is_exempted: isExempted,
          actual_amount: isExempted ? 0 : calculatedAmountPerStudent
        };
      });
    }

    const newEvent = await Event.create({
      event_name,
      event_type,
      event_date,
      payment_deadline,
      description,
      breakdown: breakdown || [],
      total_amount,
      amount_per_student: calculatedAmountPerStudent,
      total_students: students.length,
      payments,
      section_payments: sectionPayments,
      pricing_model: pricing_model || 'fixed',
      target_sections: target_sections || [],
      exempted_students: exempted_students || [],
      status: 'Active'
    });

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
});

// Update payment status - handles both student and section payments
router.post('/:id/payments', async (req, res) => {
  try {
    const { student_id, status, section } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Handle section-based payment
    if (event.pricing_model === 'section' && section) {
      const sectionPaymentIndex = event.section_payments.findIndex(sp => sp.section === section);
      
      if (sectionPaymentIndex !== -1) {
        event.section_payments[sectionPaymentIndex].status = status;
        event.section_payments[sectionPaymentIndex].payment_date = status === 'Paid' ? new Date() : null;
        
        // Update all students in this section (except exempted ones)
        const studentsInSection = await User.find({ role: 'student', section: section });
        studentsInSection.forEach(student => {
          const paymentIndex = event.payments.findIndex(p => p.student_id === student.LRN);
          if (paymentIndex !== -1 && !event.payments[paymentIndex].is_exempted) {
            event.payments[paymentIndex].status = status;
            event.payments[paymentIndex].payment_date = status === 'Paid' ? new Date() : null;
          }
        });
      }
    } else {
      // Handle individual student payment (fixed or split)
      const paymentIndex = event.payments.findIndex(p => p.student_id === student_id);
      
      if (paymentIndex !== -1) {
        event.payments[paymentIndex].status = status;
        event.payments[paymentIndex].payment_date = status === 'Paid' ? new Date() : null;
      } else {
        event.payments.push({
          student_id,
          status,
          payment_date: status === 'Paid' ? new Date() : null,
          is_exempted: false,
          actual_amount: event.amount_per_student
        });
      }
    }
    
    await event.save();
    
    res.json({
      message: 'Payment updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error updating payment' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// Mark event as done (Active -> Completed)
router.patch('/:id/mark-done', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event marked as completed',
      event
    });
  } catch (error) {
    console.error('Error marking event as done:', error);
    res.status(500).json({ message: 'Server error marking event as done' });
  }
});

// Unmark event as done (Completed -> Active)
router.patch('/:id/unmark-done', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'Active' },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event unmarked successfully',
      event
    });
  } catch (error) {
    console.error('Error unmarking event:', error);
    res.status(500).json({ message: 'Server error unmarking event' });
  }
});

export default router;