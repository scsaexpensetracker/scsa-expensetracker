import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Payment Reminder', 'Due Date', 'Balance Alert', 'General Announcement', 'Event Reminder']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  related_module: {
    type: String,
    enum: ['Tuition Fees', 'Events', 'Uniforms & Books', 'General'],
    default: 'General'
  },
  school_year: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;