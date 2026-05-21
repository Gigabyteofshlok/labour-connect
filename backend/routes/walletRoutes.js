// WALLET ROUTER
const express = require('express');
const router = express.Router();
const { getWallet, getTransactions, depositFunds, getEarningsAnalytics } = require('../controllers/walletController');
const { authenticateJWT } = require('../middleware/auth');

// Protected Wallet Actions
router.get('/', authenticateJWT, getWallet);
router.get('/transactions', authenticateJWT, getTransactions);
router.post('/deposit', authenticateJWT, depositFunds);
router.get('/analytics', authenticateJWT, getEarningsAnalytics);

module.exports = router;
