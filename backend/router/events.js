import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

// Get all events with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, status, event_type } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (status) filter.status = status;
    if (event_type) filter.event_type = event_type;

    const events = await Event.find(filter).populate('LRN', 'firstname middlename lastname gradelevel section');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Get events by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const events = await Event.find({ LRN: req.params.lrn });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const { LRN, event_name, event_type, amount_required, amount_paid, due_date, event_date, description } = req.body;

    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const balance = amount_required - (amount_paid || 0);

    const newEvent = await Event.create({
      LRN,
      event_name,
      event_type,
      amount_required,
      amount_paid: amount_paid || 0,
      balance,
      due_date,
      event_date,
      description,
      status: balance === 0 ? 'Paid' : balance < amount_required ? 'Partially Paid' : 'Unpaid'
    });

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { event_name, event_type, amount_required, amount_paid, due_date, event_date, description, status } = req.body;
    
    const balance = amount_required - amount_paid;
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        event_name,
        event_type,
        amount_required,
        amount_paid,
        balance,
        due_date,
        event_date,
        description,
        status: status || (balance === 0 ? 'Paid' : balance < amount_required ? 'Partially Paid' : 'Unpaid')
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error updating event' });
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

export default router;