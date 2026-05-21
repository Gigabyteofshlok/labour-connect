// ADMIN ROUTER
const express = require('express');
const router = express.Router();
const { verifyWorker, getPendingWorkers, getPlatformStats } = require('../controllers/adminController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// All routes here are locked to Admin role
router.post('/verify', authenticateJWT, requireRole(['admin']), verifyWorker);
router.get('/pending', authenticateJWT, requireRole(['admin']), getPendingWorkers);
router.get('/stats', authenticateJWT, requireRole(['admin']), getPlatformStats);

module.exports = router;
