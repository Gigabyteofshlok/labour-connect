// BOOKING ROUTER
const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  respondToBooking, 
  markArrived,
  verifyOTP,
  startJob, 
  completeJob, 
  getMyBookings, 
  addReview 
} = require('../controllers/bookingController');
const { authenticateJWT } = require('../middleware/auth');

// All booking routes are protected
router.post('/create', authenticateJWT, createBooking);
router.post('/respond', authenticateJWT, respondToBooking);
router.post('/arrived', authenticateJWT, markArrived);
router.post('/verify-otp', authenticateJWT, verifyOTP);
router.post('/start', authenticateJWT, startJob);  // Legacy OTP-start (kept for compatibility)
router.post('/complete', authenticateJWT, completeJob);
router.get('/my', authenticateJWT, getMyBookings);
router.post('/review', authenticateJWT, addReview);

module.exports = router;
