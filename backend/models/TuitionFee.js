import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  receipt_number: {
    type: String,
    trim: true
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Check', 'Bank Transfer', 'Online Payment', ''],
    default: ''
  },
  remarks: {
    type: String,
    trim: true
  },
  balance_after_payment: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

const tuitionFeeSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  school_year: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['1st Semester', '2nd Semester']
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  amount_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  balance: {
    type: Number,
    required: true,
    min: 0
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
  payment_history: [paymentHistorySchema]
}, {
  timestamps: true
});

// Add compound index to ensure one tuition fee per semester per school year per student
tuitionFeeSchema.index({ LRN: 1, school_year: 1, semester: 1 }, { unique: true });

const TuitionFee = mongoose.model('TuitionFee', tuitionFeeSchema);

export default TuitionFee;