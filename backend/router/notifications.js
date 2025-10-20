import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Get all notifications with filters
router.get('/', async (req, res) => {
  try {
    const { LRN, type, isRead, priority, school_year } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (priority) filter.priority = priority;
    if (school_year) filter.school_year = school_year;

    const notifications = await Notification.find(filter)
      .populate('LRN', 'firstname middlename lastname gradelevel section')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Get notifications by student LRN
router.get('/student/:lrn', async (req, res) => {
  try {
    const notifications = await Notification.find({ LRN: req.params.lrn })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Get unread count
router.get('/unread-count/:lrn', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      LRN: req.params.lrn, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// Create new notification
router.post('/', async (req, res) => {
  try {
    const { LRN, title, message, type, priority, related_module, school_year } = req.body;

    const student = await User.findOne({ LRN });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newNotification = await Notification.create({
      LRN,
      title,
      message,
      type,
      priority: priority || 'Medium',
      related_module: related_module || 'General',
      school_year
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error creating notification' });
  }
});

// Update notification
router.put('/:id', async (req, res) => {
  try {
    const { title, message, type, priority, related_module, isRead } = req.body;
    
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        title,
        message,
        type,
        priority,
        related_module,
        isRead
      },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// Mark all as read for a student
router.patch('/mark-all-read/:lrn', async (req, res) => {
  try {
    await Notification.updateMany(
      { LRN: req.params.lrn, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error deleting notification' });
  }
});

export default router;