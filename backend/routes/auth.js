const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');

module.exports = (sessionStore) => {
    // Register new student
    router.post('/register', async (req, res) => {
        try {
            const { lrn, firstName, middleName, lastName, contactNumber, password } = req.body;

            if (!lrn || !firstName || !lastName || !contactNumber || !password) {
                return res.status(400).json({ message: 'All required fields must be filled' });
            }

            const existingUser = await User.findOne({ lrn });
            if (existingUser) {
                return res.status(400).json({ message: 'LRN already registered' });
            }

            const existingStudent = await Student.findOne({ lrn });
            if (existingStudent) {
                return res.status(400).json({ message: 'LRN already registered' });
            }

            const username = lrn;
            const user = new User({
                lrn,
                username,
                firstName,
                middleName,
                lastName,
                contactNumber,
                password,
                role: 'student',
            });

            await user.save();

            const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
            const student = new Student({
                lrn: user.lrn,
                name: fullName,
                grade: 'Not Assigned',
            });

            await student.save();

            res.status(201).json({
                message: 'Registration successful',
                username: user.username,
                lrn: user.lrn,
            });
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ message: 'LRN already registered' });
            }
            res.status(500).json({ message: 'Server error during registration' });
        }
    });

    // Login - FIXED
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = await User.findOne({
                $or: [{ username }, { lrn: username }],
            });

            if (!user) {
                return res.status(401).json({ message: 'Invalid LRN or password' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid LRN or password' });
            }

            // Regenerate session to prevent fixation attacks
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Session regeneration error:', err);
                    return res.status(500).json({ message: 'Session error' });
                }

                // Set session data
                req.session.userId = user._id.toString();
                
                console.log('Login - SessionID:', req.sessionID);
                console.log('Login - UserId set:', req.session.userId);

                // Save session explicitly
                req.session.save((err) => {
                    if (err) {
                        console.error('Login - Session save error:', err);
                        return res.status(500).json({ message: 'Session save failed' });
                    }

                    console.log('Login - Session saved successfully');
                    console.log('Login - Set-Cookie header:', res.getHeader('Set-Cookie'));

                    // Return user data
                    res.json({
                        message: 'Login successful',
                        user: {
                            id: user._id,
                            username: user.username,
                            lrn: user.lrn,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                        },
                    });
                });
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error during login' });
        }
    });

    // Check session - FIXED
    router.get('/check-session', async (req, res) => {
        try {
            console.log('=== CHECK-SESSION ===');
            console.log('SessionID:', req.sessionID);
            console.log('Session userId:', req.session?.userId || 'None');

            // Validate session
            if (!req.session || !req.session.userId) {
                console.log('Check-session - No session or userId');
                return res.status(401).json({ message: 'No active session' });
            }

            // Find user
            const user = await User.findById(req.session.userId).select('-password');
            console.log('Check-session - Found user:', user ? user.username : 'Not found');

            if (!user) {
                console.log('Check-session - User not found for userId:', req.session.userId);
                return res.status(401).json({ message: 'User not found' });
            }

            // Return user data
            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    lrn: user.lrn,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error('Session check error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Logout - FIXED
    router.post('/logout', (req, res) => {
        console.log('=== LOGOUT ===');
        console.log('SessionID:', req.sessionID);
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.clearCookie('connect.sid', { path: '/' }); // FIXED: Use correct cookie name
            console.log('Session destroyed successfully');
            res.json({ message: 'Logout successful' });
        });
    });

    return router;
};