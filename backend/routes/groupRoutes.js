// COOPERATIVE GROUP ROUTER
const express = require('express');
const router = express.Router();
const { createGroup, joinGroup, leaveGroup, getAllGroups, logAttendance, getAttendance } = require('../controllers/groupController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Public/Shared Cooperative Routes
router.get('/', authenticateJWT, getAllGroups);

// Worker Cooperative Actions
router.post('/create', authenticateJWT, requireRole(['worker']), createGroup);
router.post('/join', authenticateJWT, requireRole(['worker']), joinGroup);
router.post('/leave', authenticateJWT, requireRole(['worker']), leaveGroup);

// Attendance Log endpoints (Contractors or Workers)
router.post('/attendance', authenticateJWT, logAttendance);
router.get('/attendance', authenticateJWT, getAttendance);

module.exports = router;
