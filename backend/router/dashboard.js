import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all users (Admin only - for filtering and CRUD)
router.get('/users', async (req, res) => {
  try {
    const { LRN, section, lastname, gradelevel } = req.query;
    
    let filter = {};
    
    if (LRN) filter.LRN = { $regex: LRN, $options: 'i' };
    if (section) filter.section = section;
    if (lastname) filter.lastname = { $regex: lastname, $options: 'i' };
    if (gradelevel) filter.gradelevel = gradelevel;

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get single user by LRN
router.get('/users/:lrn', async (req, res) => {
  try {
    const user = await User.findOne({ LRN: req.params.lrn }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// Update user
router.put('/users/:lrn', async (req, res) => {
  try {
    const { firstname, middlename, lastname, address, gradelevel, section, strand, school_year, contactnumber, password } = req.body;
    
    const updateData = {
      firstname,
      middlename,
      lastname,
      address,
      gradelevel,
      section,
      strand,
      school_year,
      contactnumber
    };
    
    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    const user = await User.findOneAndUpdate(
      { LRN: req.params.lrn },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete user
router.delete('/users/:lrn', async (req, res) => {
  try {
    // Prevent deleting admin account
    if (req.params.lrn === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin account' });
    }

    const user = await User.findOneAndDelete({ LRN: req.params.lrn });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

export default router;