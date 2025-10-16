// File: models/Student.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    lrn: {
        type: String,
        required: [true, 'LRN is required'],
        unique: true,
        trim: true,
        ref: 'User',
        index: true, // Add index for faster queries
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    grade: {
        type: String,
        required: [true, 'Grade is required'],
        default: 'Not Assigned',
    },
    tuition: {
        total: {
            type: Number,
            default: 0,
            min: [0, 'Tuition total cannot be negative'],
        },
        paid: {
            type: Number,
            default: 0,
            min: [0, 'Tuition paid cannot be negative'],
        },
        dueDate: {
            type: String,
            default: '',
        },
    },
    events: {
        total: {
            type: Number,
            default: 0,
            min: [0, 'Events total cannot be negative'],
        },
        paid: {
            type: Number,
            default: 0,
            min: [0, 'Events paid cannot be negative'],
        },
    },
    uniforms: {
        total: {
            type: Number,
            default: 0,
            min: [0, 'Uniforms total cannot be negative'],
        },
        paid: {
            type: Number,
            default: 0,
            min: [0, 'Uniforms paid cannot be negative'],
        },
    },
    paymentHistory: [{
        date: {
            type: Date,
            default: Date.now,
        },
        description: {
            type: String,
            required: [true, 'Payment description is required'],
        },
        type: {
            type: String,
            enum: ['Tuition', 'Events', 'Uniforms', 'Other'], // Match case in /api/students/:id/payment
            required: [true, 'Payment type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0, 'Payment amount cannot be negative'],
        },
        status: {
            type: String,
            enum: ['paid', 'pending', 'overdue'],
            default: 'paid',
        },
        receiptNo: {
            type: String,
            default: '',
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update timestamp on save
studentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for balance calculation
studentSchema.virtual('tuitionBalance').get(function () {
    return this.tuition.total - this.tuition.paid;
});

studentSchema.virtual('eventsBalance').get(function () {
    return this.events.total - this.events.paid;
});

studentSchema.virtual('uniformsBalance').get(function () {
    return this.uniforms.total - this.uniforms.paid;
});

studentSchema.virtual('totalBalance').get(function () {
    return this.tuitionBalance + this.eventsBalance + this.uniformsBalance;
});

// Include virtuals in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);