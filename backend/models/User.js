import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  LRN: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  middlename: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  gradelevel: {
    type: String,
    required: true,
    enum: ['Grade 11', 'Grade 12']
  },
  section: {
    type: String,
    required: true,
    enum: ['Virgen Del Rosario', 'Virgen Del Pilar', 'Virgen Del Carmen']
  },
  strand: {
    type: String,
    required: true,
    enum: ['STEM', 'ABM', 'HUMSS'],
    trim: true
  },
  school_year: {
    type: String,
    required: true,
    trim: true
  },
  contactnumber: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;