import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  payment_type: {
    type: String,
    required: true,
    enum: ['Tuition Fee', 'Event Contribution', 'Uniform', 'Book', 'Laboratory Materials', 'Others']
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['Cash', 'Check', 'Bank Transfer', 'Online Payment']
  },
  receipt_number: {
    type: String,
    required: true,
    unique: true
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  school_year: {
    type: String,
    required: true
  },
  processed_by: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

export default PaymentHistory;