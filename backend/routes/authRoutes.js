// AUTHENTICATION ROUTES
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);

// Protected Auth Endpoints
router.get('/me', authenticateJWT, getMe);

module.exports = router;
