import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['Foundation Day', 'Field Trip', 'Sports Fest', 'Christmas Party', 'Graduation', 'Others']
  },
  amount_required: {
    type: Number,
    required: true
  },
  amount_paid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    required: true
  },
  due_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'],
    default: 'Unpaid'
  },
  event_date: {
    type: Date,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;