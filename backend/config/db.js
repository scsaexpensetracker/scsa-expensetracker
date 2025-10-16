const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected Successfully');
        
        // Create default admin user if not exists
        const User = require('../models/User');
        const adminExists = await User.findOne({ username: 'admin' });
        
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                lrn: 'ADMIN-001',
                firstName: 'System',
                middleName: 'Admin',
                lastName: 'Administrator',
                contactNumber: '09000000000'
            });
            console.log('Default admin account created');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;