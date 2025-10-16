const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Check if user ID is in session
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'No authentication, access denied' });
        }
        
        // Find user by session ID
        const user = await User.findById(req.session.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        // Check if user ID is in session
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'No authentication, access denied' });
        }
        
        // Find user by session ID
        const user = await User.findById(req.session.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = { auth, adminAuth };