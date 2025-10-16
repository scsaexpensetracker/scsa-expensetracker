require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// CRITICAL: Trust proxy for Render (and other reverse proxies)
// This is required for secure cookies to work on HTTPS behind a proxy
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Log incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Cookies received:', req.headers.cookie || 'None');
    next();
});

// Session store configuration
const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
});

sessionStore.on('error', (error) => {
    console.error('MongoStore error:', error);
});

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        name: 'connect.sid',
        cookie: {
            secure: process.env.NODE_ENV === 'production',  // true in production (HTTPS), false locally
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            sameSite: 'lax',  // Keep as 'lax' since same domain
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'  // Let browser set domain in production
        }
    })
);

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log('SessionID:', req.sessionID || 'None');
    console.log('Session userId:', req.session?.userId || 'None');
    console.log('Set-Cookie will be:', res.getHeader('Set-Cookie') || 'None');
    
    // Log response headers after they're set
    const oldWriteHead = res.writeHead;
    res.writeHead = function(...args) {
        console.log('Response Set-Cookie:', res.getHeader('Set-Cookie') || 'None sent');
        return oldWriteHead.apply(res, args);
    };
    
    next();
});

// API Routes
app.use('/api/auth', require('./routes/auth')(sessionStore));
app.use('/api/students', require('./routes/students'));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Test cookies endpoint
app.get('/api/test-cookies', (req, res) => {
    console.log('=== TEST COOKIES ===');
    console.log('SessionID:', req.sessionID);
    console.log('Cookies received:', req.headers.cookie);
    console.log('Session data:', req.session);
    res.json({
        sessionID: req.sessionID,
        cookiesReceived: req.headers.cookie || 'None',
        sessionData: req.session
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
});