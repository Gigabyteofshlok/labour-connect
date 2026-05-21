// AI ROUTER
const express = require('express');
const router = express.Router();
const { chatHelper, estimateWage, generateProfileDescription, generateJobDescription } = require('../controllers/aiController');
const { authenticateJWT } = require('../middleware/auth');

// Protected AI Features
router.post('/chat', authenticateJWT, chatHelper);
router.post('/estimate-wage', authenticateJWT, estimateWage);
router.post('/generate-profile', authenticateJWT, generateProfileDescription);
router.post('/generate-job-desc', authenticateJWT, generateJobDescription);

module.exports = router;
