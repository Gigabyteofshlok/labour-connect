// BOOKING PHOTO UPLOAD CONTROLLER
// Handles before/after work proof photo uploads from workers,
// stores URLs in booking_photos table, and serves gallery for customer verification.

const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Upload a booking proof photo (before or after work)
const uploadPhoto = async (req, res) => {
  const workerId = req.user.id;
  const { bookingId, imageType } = req.body; // imageType: 'before' | 'after'

  if (!bookingId || !imageType) {
    return res.status(400).json({ error: 'bookingId and imageType (before/after) are required.' });
  }

  if (!['before', 'after'].includes(imageType)) {
    return res.status(400).json({ error: 'imageType must be "before" or "after".' });
  }

  try {
    let imageUrl = null;

    if (req.file) {
      // Multer uploaded a file to disk
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageBase64) {
      // Base64 encoded image fallback (for mobile/web camera)
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const ext = req.body.imageBase64.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpg';
      const filename = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const uploadPath = path.join(__dirname, '../uploads', filename);

      // Ensure uploads folder exists
      if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
        fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
      }

      fs.writeFileSync(uploadPath, base64Data, 'base64');
      imageUrl = `/uploads/${filename}`;
    } else {
      return res.status(400).json({ error: 'No image provided. Send a file or imageBase64.' });
    }

    // Save photo record in DB
    const result = await db.query(
      `INSERT INTO booking_photos (booking_id, worker_id, image_url, image_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookingId, workerId, imageUrl, imageType]
    );

    const photo = result.rows[0];

    // If this is an "after" photo, notify the customer and update booking status to completed
    if (imageType === 'after') {
      const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      const booking = bookingRes.rows[0];

      if (booking) {
        const clientUserId = booking.customer_id || booking.contractor_id;

        // Notify customer
        await db.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [clientUserId, '✅ Work Complete — Photos Uploaded!', 
           `Your ${booking.service_type} service is done. Review the completion photos and verify the work.`,
           'work_completed']
        );

        // Realtime sync
        const io = req.app.get('io');
        if (io && clientUserId) {
          io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
          io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
          io.to(`user:${clientUserId}`).emit('booking-photos-uploaded', {
            bookingId,
            imageType,
            imageUrl
          });
        }
      }
    }

    console.log(`📷 [PHOTOS] Photo uploaded: booking=${bookingId}, type=${imageType}, url=${imageUrl}`);

    res.status(210).json({
      message: `${imageType === 'before' ? 'Before' : 'After'} work photo uploaded successfully!`,
      photo
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Server error. Failed to upload photo.' });
  }
};

// Get all photos for a booking (customer can view)
const getBookingPhotos = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user has access to this booking
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Allow access to customer, worker, or admin
    const hasAccess = 
      booking.customer_id === userId ||
      booking.contractor_id === userId ||
      booking.worker_id === userId ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this booking photos.' });
    }

    const result = await db.query(
      'SELECT * FROM booking_photos WHERE booking_id = $1 ORDER BY uploaded_at ASC',
      [bookingId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve photos.' });
  }
};

// Customer verifies completion and triggers payment
const verifyCompletion = async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.customer_id !== userId && booking.contractor_id !== userId) {
      return res.status(403).json({ error: 'Only the customer can verify completion.' });
    }

    // Verify if payment has already been completed to avoid double charge/debit
    if (booking.status === 'completed' && booking.payment_status === 'completed') {
      return res.status(400).json({ error: 'This booking has already been verified and paid.' });
    }

    const payAmount = parseFloat(booking.total_amount);
    const clientUserId = booking.customer_id || booking.contractor_id;

    // 1. Debit from client wallet
    const clientWalletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [clientUserId]);
    const clientWallet = clientWalletRes.rows[0];

    if (!clientWallet || parseFloat(clientWallet.balance) < payAmount) {
      return res.status(400).json({ error: 'Payment settlement failed. Client has insufficient funds.' });
    }

    // 2. Update booking to completed
    const updatedBookingRes = await db.query(
      "UPDATE bookings SET status = 'completed', completed_at = CURRENT_TIMESTAMP, payment_status = 'completed', end_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );

    // 3. Deduct client wallet
    const newClientBal = parseFloat(clientWallet.balance) - payAmount;
    await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newClientBal, clientWallet.id]);
    await db.query(
      "INSERT INTO transactions (wallet_id, booking_id, type, amount, description) VALUES ($1, $2, 'debit', $3, $4)",
      [clientWallet.id, bookingId, payAmount, `Payment for ${booking.service_type} service (Photo Verified)`]
    );

    const io = req.app.get('io');

    // 4. Credit worker / split group
    if (booking.worker_id) {
      const workerWalletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [booking.worker_id]);
      const workerWallet = workerWalletRes.rows[0];
      if (workerWallet) {
        const newWorkerBal = parseFloat(workerWallet.balance) + payAmount;
        await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newWorkerBal, workerWallet.id]);
        await db.query(
          "INSERT INTO transactions (wallet_id, booking_id, type, amount, description) VALUES ($1, $2, 'credit', $3, $4)",
          [workerWallet.id, bookingId, payAmount, `Earning from ${booking.service_type} job (Photo Verified)`]
        );
      }
      await db.query(
        "UPDATE workers SET status = 'online', completed_jobs_count = completed_jobs_count + 1 WHERE user_id = $1",
        [booking.worker_id]
      );

      // Notify worker
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [booking.worker_id, '🎉 Work Verified & Paid!', 
         `Your ${booking.service_type} work has been verified by the customer. ₹${payAmount.toFixed(2)} credited to your wallet!`,
         'payment_received']
      );

      if (io) {
        io.to(`user:${booking.worker_id}`).emit('payment-released', { bookingId, amount: payAmount });
        io.to(`user:${booking.worker_id}`).emit('db-sync-refresh', { type: 'bookings' });
        io.to(`user:${booking.worker_id}`).emit('db-sync-refresh', { type: 'wallet' });
        io.to(`user:${booking.worker_id}`).emit('db-sync-refresh', { type: 'notifications' });
      }
    } else if (booking.group_id) {
      const membersRes = await db.query('SELECT worker_id FROM group_members WHERE group_id = $1', [booking.group_id]);
      const members = membersRes.rows;
      if (members.length > 0) {
        const splitAmount = parseFloat((payAmount / members.length).toFixed(2));
        for (const member of members) {
          const wWalletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [member.worker_id]);
          const wWallet = wWalletRes.rows[0];
          if (wWallet) {
            const nBal = parseFloat(wWallet.balance) + splitAmount;
            await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [nBal, wWallet.id]);
            await db.query(
              "INSERT INTO transactions (wallet_id, booking_id, type, amount, description) VALUES ($1, $2, 'credit', $3, $4)",
              [wWallet.id, bookingId, splitAmount, `Cooperative earnings split for ${booking.service_type} (Photo Verified)`]
            );
          }
          await db.query(
            "UPDATE workers SET status = 'online', completed_jobs_count = completed_jobs_count + 1 WHERE user_id = $1",
            [member.worker_id]
          );
          
          // Notify member
          await db.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
            [member.worker_id, '🎉 Cooperative Work Paid!', 
             `Your ${booking.service_type} project has been verified. ₹${splitAmount.toFixed(2)} credited!`,
             'payment_received']
          );

          if (io) {
            io.to(`user:${member.worker_id}`).emit('payment-released', { bookingId, amount: splitAmount });
            io.to(`user:${member.worker_id}`).emit('db-sync-refresh', { type: 'bookings' });
            io.to(`user:${member.worker_id}`).emit('db-sync-refresh', { type: 'wallet' });
            io.to(`user:${member.worker_id}`).emit('db-sync-refresh', { type: 'notifications' });
          }
        }
      }
    }

    // 5. Notify client
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [clientUserId, '🎉 Work Verified & Released', `You verified ${booking.service_type} completion. ₹${payAmount.toFixed(2)} paid to specialist.`, 'booking_completed']
    );

    if (io) {
      io.to(`user:${clientUserId}`).emit('job-completed', { bookingId });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'wallet' });
    }

    res.status(200).json({ 
      message: 'Booking verified, completed, and payment settled successfully!',
      booking: updatedBookingRes.rows[0]
    });
  } catch (error) {
    console.error('Verify completion error:', error);
    res.status(500).json({ error: 'Server error. Failed to verify completion and settle payment.' });
  }
};

module.exports = { uploadPhoto, getBookingPhotos, verifyCompletion };
