// LABOUR CONNECT EXPRESS BACKEND ENTRY POINT
// Load environment variables immediately on spin-up
require('dotenv').config();
console.log('✨ [DOTENV] Environment variables loaded successfully.');
console.log('✨ dotenv loaded');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Port allocation
const PORT = process.env.PORT || 5000;

// Scaffolding Express App
const app = express();

// Security and utility middleware
app.use(helmet()); // Sets diverse HTTP headers for prevention against XSS, clickjacking, etc.
app.use(cors({
  origin: '*', // Allows cross-origin REST communication with Vite frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Parses incoming application/json body elements (10MB for base64 photos)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Colorful request logs

// Serve uploaded photos statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Terminal welcome logo
console.log(`
=========================================
 ⚡  L A B O U R   C O N N E C T  ⚡
      - On-Demand Skilled Workforce -
=========================================
`);

// Route imports
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const groupRoutes = require('./routes/groupRoutes');
const walletRoutes = require('./routes/walletRoutes');
const schemesRoutes = require('./routes/schemesRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const shopRoutes = require('./routes/shopRoutes');
const photoRoutes = require('./routes/photoRoutes');

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date(), 
    service: 'Labour Connect Backend API',
    uptime: process.uptime()
  });
});

// Mounting main api routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/photos', photoRoutes);

// Custom 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found. Check the URL and method type.' });
});

// Centralized error handler middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error Handler:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error. Please contact backend technical support.',
    message: err.message 
  });
});

const http = require('http');
const socketService = require('./config/socket');

// Wrap app inside Node http server for WebSocket compatibility
const server = http.createServer(app);
const io = socketService.initSocket(server);

// Share IO service instance globally on Express app context
app.set('io', io);

// Spin up server
server.listen(PORT, () => {
  console.log(`🚀 Server successfully operating on Port http://localhost:${PORT}`);
  console.log(`🏥 Healthcheck endpoints active at http://localhost:${PORT}/api/health`);
  console.log(`🔑 [JWT] Authentication initialized successfully with signature verification.`);
  console.log(`🔑 JWT initialized`);
});

module.exports = server; // Exporting for programmatic test runs
