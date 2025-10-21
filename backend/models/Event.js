import mongoose from 'mongoose';

const breakdownItemSchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  payment_date: {
    type: Date
  },
  is_exempted: {
    type: Boolean,
    default: false
  },
  actual_amount: {
    type: Number
  }
}, { _id: true });

// Schema for section-strand combination
const targetSectionSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['Virgen Del Rosario', 'Virgen Del Pilar', 'Virgen Del Carmen']
  },
  strand: {
    type: String,
    required: true,
    enum: ['STEM', 'ABM', 'HUMSS']
  }
}, { _id: false });

// For section-based payments
const sectionPaymentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['Virgen Del Rosario', 'Virgen Del Pilar', 'Virgen Del Carmen']
  },
  strand: {
    type: String,
    required: true,
    enum: ['STEM', 'ABM', 'HUMSS']
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  payment_date: {
    type: Date
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  event_name: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['Foundation Day', 'Field Trip', 'Sports Fest', 'Christmas Party', 'Graduation', 'Others']
  },
  event_date: {
    type: Date,
    required: true
  },
  payment_deadline: {
    type: Date,
    required: true
  },
  description: {
    type: String
  },
  breakdown: [breakdownItemSchema],
  total_amount: {
    type: Number,
    required: true
  },
  amount_per_student: {
    type: Number,
    required: true
  },
  total_students: {
    type: Number,
    required: true
  },
  payments: [paymentSchema],
  section_payments: [sectionPaymentSchema],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Overdue'],
    default: 'Active'
  },
  pricing_model: {
    type: String,
    enum: ['per_student', 'section'],
    default: 'per_student',
    required: true
  },
  target_sections: [targetSectionSchema],
  exempted_students: [{
    type: String,
    ref: 'User'
  }],
  has_breakdown: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual to calculate total collected
eventSchema.virtual('total_collected').get(function() {
  if (this.pricing_model === 'section') {
    const paidSections = this.section_payments.filter(sp => sp.status === 'Paid');
    return paidSections.reduce((sum, sp) => sum + sp.amount, 0);
  } else {
    const paidCount = this.payments.filter(p => p.status === 'Paid' && !p.is_exempted).length;
    return paidCount * this.amount_per_student;
  }
});

// Virtual to calculate students paid count
eventSchema.virtual('students_paid_count').get(function() {
  return this.payments.filter(p => p.status === 'Paid' && !p.is_exempted).length;
});

// Virtual to calculate total expected
eventSchema.virtual('total_expected').get(function() {
  if (this.pricing_model === 'section') {
    return this.section_payments.reduce((sum, sp) => sum + sp.amount, 0);
  } else {
    const nonExemptedCount = this.payments.filter(p => !p.is_exempted).length;
    return nonExemptedCount * this.amount_per_student;
  }
});

// Virtual to calculate exempted students count
eventSchema.virtual('exempted_count').get(function() {
  return this.payments.filter(p => p.is_exempted).length;
});

const Event = mongoose.model('Event', eventSchema);

export default Event;