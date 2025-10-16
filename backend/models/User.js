// File: models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true, // Automatically generate ObjectId
    },
    lrn: {
        type: String,
        required: [true, 'LRN is required'],
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        index: true, // Add index for faster queries
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    middleName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
        validate: {
            validator: function (v) {
                return /^\d{10,11}$/.test(v); // Example: Validate for 10-11 digit phone numbers
            },
            message: 'Contact number must be 10 or 11 digits',
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        throw new Error('Password comparison failed');
    }
};

module.exports = mongoose.model('User', userSchema);