import mongoose from 'mongoose';

const tuitionFeeSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  school_year: {
    type: String,
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    default: 0
  },
  amount_paid: {
    type: Number,
    required: true,
    default: 0
  },
  balance: {
    type: Number,
    required: true,
    default: 0
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
  payment_history: [{
    amount: Number,
    payment_date: Date,
    receipt_number: String,
    payment_method: String,
    remarks: String
  }]
}, {
  timestamps: true
});

const TuitionFee = mongoose.model('TuitionFee', tuitionFeeSchema);

export default TuitionFee;