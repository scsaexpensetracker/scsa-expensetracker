import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { LRN, password } = req.body;

    if (!LRN || !password) {
      return res.status(400).json({ message: 'LRN and password are required' });
    }

    const user = await User.findOne({ LRN });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid LRN or password' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid LRN or password' });
    }

    // Return user data without password
    const userData = {
      LRN: user.LRN,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      address: user.address,
      gradelevel: user.gradelevel,
      section: user.section,
      strand: user.strand,
      school_year: user.school_year,
      contactnumber: user.contactnumber,
      role: user.role
    };

    res.json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register Route (Admin only - validation done on frontend)
router.post('/register', async (req, res) => {
  try {
    const { LRN, firstname, middlename, lastname, address, gradelevel, section, strand, school_year, contactnumber, password } = req.body;

    // Check if all fields are provided
    if (!LRN || !firstname || !middlename || !lastname || !address || !gradelevel || !section || !strand || !school_year || !contactnumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if LRN already exists
    const existingUser = await User.findOne({ LRN });
    if (existingUser) {
      return res.status(400).json({ message: 'LRN already exists' });
    }

    // Create new user
    const newUser = await User.create({
      LRN,
      firstname,
      middlename,
      lastname,
      address,
      gradelevel,
      section,
      strand,
      school_year,
      contactnumber,
      password,
      role: 'student'
    });

    res.status(201).json({
      message: 'Student registered successfully',
      user: {
        LRN: newUser.LRN,
        firstname: newUser.firstname,
        lastname: newUser.lastname
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

export default router;