const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { auth, adminAuth } = require('../middleware/auth');

// Get student data by LRN (for logged in student)
router.get('/my-data', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ lrn: req.user.lrn });
        
        if (!student) {
            return res.status(404).json({ message: 'Student data not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all students (admin only)
router.get('/all', adminAuth, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add or update student data (admin only)
router.post('/add', adminAuth, async (req, res) => {
    try {
        const { lrn, name, grade, tuition, events, uniforms } = req.body;
        
        // Check if student already exists
        let student = await Student.findOne({ lrn });
        
        if (student) {
            // Update existing student
            student.name = name;
            student.grade = grade;
            student.tuition = tuition;
            student.events = events;
            student.uniforms = uniforms;
            await student.save();
            
            return res.json({ 
                message: 'Student data updated successfully',
                student 
            });
        }
        
        // Create new student record
        student = new Student({
            lrn,
            name,
            grade,
            tuition,
            events,
            uniforms
        });
        
        await student.save();
        
        res.status(201).json({ 
            message: 'Student data added successfully',
            student 
        });
    } catch (error) {
        console.error('Error adding/updating student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:id/payment', adminAuth, async (req, res) => {
    try {
        const { description, type, amount, receiptNo } = req.body;
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Validate type
        if (!['Tuition', 'Events', 'Uniforms', 'Other'].includes(type)) {
            return res.status(400).json({ message: 'Invalid payment type' });
        }
        
        // Add payment to history
        student.paymentHistory.push({
            date: new Date(),
            description,
            type, // Already capitalized
            amount,
            status: 'paid',
            receiptNo,
        });
        
        // Update paid amounts based on type
        if (type === 'Tuition') {
            student.tuition.paid += amount;
        } else if (type === 'Events') {
            student.events.paid += amount;
        } else if (type === 'Uniforms') {
            student.uniforms.paid += amount;
        }
        
        await student.save();
        
        res.json({ 
            message: 'Payment recorded successfully',
            student 
        });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;