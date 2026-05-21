// SERVICE SHOPS ROUTER
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authenticateJWT } = require('../middleware/auth');

// Get nearby shops (requires authorization)
router.get('/nearby', authenticateJWT, shopController.getNearbyShops);

module.exports = router;
