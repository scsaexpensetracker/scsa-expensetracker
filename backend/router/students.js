import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const { gradelevel, section, strand, school_year } = req.query;
    
    let filter = { role: 'student' };
    
    if (gradelevel) filter.gradelevel = gradelevel;
    if (section) filter.section = section;
    if (strand) filter.strand = strand;
    if (school_year) filter.school_year = school_year;

    const students = await User.find(filter)
      .select('-password')
      .sort({ lastname: 1, firstname: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// Get student by LRN
router.get('/:lrn', async (req, res) => {
  try {
    const student = await User.findOne({ 
      LRN: req.params.lrn,
      role: 'student' 
    }).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
});

export default router;