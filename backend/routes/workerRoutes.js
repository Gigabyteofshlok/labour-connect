// WORKER ENDPOINTS
const express = require('express');
const router = express.Router();
const { getNearbyWorkers, updateStatus, updateLocation, updateProfile } = require('../controllers/workerController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Public search for customers / contractors
router.get('/nearby', getNearbyWorkers);

// Protected Worker Actions
router.put('/status', authenticateJWT, requireRole(['worker']), updateStatus);
router.put('/location', authenticateJWT, requireRole(['worker']), updateLocation);
router.put('/profile', authenticateJWT, requireRole(['worker']), updateProfile);

module.exports = router;
