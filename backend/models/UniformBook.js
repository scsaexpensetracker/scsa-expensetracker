import mongoose from 'mongoose';

const uniformBookSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    ref: 'User'
  },
  items: [{
    item_type: {
      type: String,
      required: true,
      enum: ['Uniform', 'Book', 'Others']
    },
    item_name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unit_price: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  total_amount: {
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
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  purchase_date: {
    type: Date,
    default: Date.now
  },
  school_year: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const UniformBook = mongoose.model('UniformBook', uniformBookSchema);

export default UniformBook;