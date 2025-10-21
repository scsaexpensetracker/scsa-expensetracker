import mongoose from 'mongoose';

const catalogSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true
  },
  // For Books
  grade_level: {
    type: String,
    enum: ['Grade 11', 'Grade 12', 'Both', '']
  },
  strand: {
    type: String,
    enum: ['STEM', 'ABM', 'HUMSS', 'All', '']
  },
  section: {
    type: String,
    enum: ['Virgen Del Rosario', 'Virgen Del Pilar', 'Virgen Del Carmen', 'All', '']
  },
  school_year: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Catalog = mongoose.model('Catalog', catalogSchema);

export default Catalog;