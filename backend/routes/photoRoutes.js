// BOOKING PHOTO ROUTES
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadPhoto, getBookingPhotos, verifyCompletion } = require('../controllers/photoController');
const { authenticateJWT } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config — disk storage for booking photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Upload a booking photo (worker only)
router.post('/upload', authenticateJWT, upload.single('photo'), uploadPhoto);

// Get all photos for a booking
router.get('/:bookingId', authenticateJWT, getBookingPhotos);

// Customer verifies work completion
router.post('/verify', authenticateJWT, verifyCompletion);

module.exports = router;
