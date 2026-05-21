// CHAT AND ALERTS ROUTER
const express = require('express');
const router = express.Router();
const { sendMessage, getChatTranscript, getMyNotifications, markNotificationsRead } = require('../controllers/chatController');
const { authenticateJWT } = require('../middleware/auth');

// Protected Chat Actions
router.post('/message', authenticateJWT, sendMessage);
router.get('/transcript', authenticateJWT, getChatTranscript);

// Protected Notifications Actions
router.get('/alerts', authenticateJWT, getMyNotifications);
router.put('/alerts/read', authenticateJWT, markNotificationsRead);

module.exports = router;
