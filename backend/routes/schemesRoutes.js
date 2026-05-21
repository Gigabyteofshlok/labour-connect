// GOVERNMENT AND LITERACY ROUTER
const express = require('express');
const router = express.Router();
const { getSchemes, checkEligibility, getFinancialLessons } = require('../controllers/schemesController');
const { authenticateJWT } = require('../middleware/auth');

// Public/Shared Access Endpoints
router.get('/', authenticateJWT, getSchemes);
router.post('/eligibility', authenticateJWT, checkEligibility);
router.get('/lessons', authenticateJWT, getFinancialLessons);

module.exports = router;
