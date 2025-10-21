import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import dashboardRouter from './router/dashboard.js';
import authRouter from './router/auth.js';
import studentsRouter from './router/students.js';
import tuitionFeesRouter from './router/tuitionFees.js';
import eventsRouter from './router/events.js';
import uniformsBooksRouter from './router/uniformBooks.js';
import notificationsRouter from './router/notifications.js';
import paymentHistoryRouter from './router/paymentHistory.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Required to serve frontend in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/dashboard', dashboardRouter);
app.use('/auth', authRouter);
app.use('/students', studentsRouter);
app.use('/tuition-fees', tuitionFeesRouter);
app.use('/events', eventsRouter);
app.use('/uniforms-books', uniformsBooksRouter);
app.use('/notifications', notificationsRouter);
app.use('/payment-history', paymentHistoryRouter);

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('✗ MONGODB_URI is not defined in the .env file');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('✓ MongoDB connected successfully');

    // Create default admin if doesn't exist
    const adminExists = await User.findOne({ LRN: 'admin' });
    if (!adminExists) {
      await User.create({
        LRN: 'admin',
        firstname: 'Admin',
        middlename: 'System',
        lastname: 'Administrator',
        address: 'SCSA Main Office',
        gradelevel: 'Grade 11',
        section: 'Virgen Del Rosario',
        strand: 'STEM',
        school_year: '2024-2025',
        contactnumber: '09469981515',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✓ Default admin created (LRN: admin, Password: admin123)');
    }
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Serve frontend build (React)
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

export default app;