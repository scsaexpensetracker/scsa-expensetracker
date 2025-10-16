require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// =============================
// 🔗 Connect to MongoDB
// =============================
connectDB();

// =============================
// ⚙️ CORS configuration
// =============================
const allowedOrigins = [
  'http://localhost:3000',        // React dev server
  'http://localhost:5000',        // Backend serving frontend
  process.env.FRONTEND_URL        // Render frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

console.log('✅ CORS allowed for:', allowedOrigins);

// =============================
// 🧱 Middleware
// =============================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Optionally serve static frontend build (only if included in repo)
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Cookies received:', req.headers.cookie || 'None');
  next();
});

// =============================
// 💾 Session configuration
// =============================
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 1 day
  autoRemove: 'native',
});

sessionStore.on('error', (error) => {
  console.error('MongoStore error:', error);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'connect.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS)
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    },
  })
);

// Log session info for debugging
app.use((req, res, next) => {
  console.log('SessionID:', req.sessionID || 'None');
  console.log('Session userId:', req.session?.userId || 'None');
  next();
});

// =============================
// 🧩 Routes
// =============================
app.use('/api/auth', require('./routes/auth')(sessionStore));
app.use('/api/students', require('./routes/students'));

// Serve frontend (if exists) — for fullstack Render deployment
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Test endpoint
app.get('/api/test-cookies', (req, res) => {
  console.log('=== TEST COOKIES ===');
  console.log('SessionID:', req.sessionID);
  console.log('Cookies received:', req.headers.cookie);
  console.log('Session data:', req.session);
  res.json({
    sessionID: req.sessionID,
    cookiesReceived: req.headers.cookie || 'None',
    sessionData: req.session,
  });
});

// =============================
// ⚠️ Error Handling
// =============================
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// =============================
// 🚀 Start Server
// =============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🖥️ Frontend: ${process.env.FRONTEND_URL || 'N/A'}`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
});