// BOOKING MANAGEMENT CONTROLLER
// Full workforce execution lifecycle: request → accept/reject → navigate → arrive → OTP verify → start → photo upload → complete → verify → payment.

const db = require('../config/db');
const socketService = require('../config/socket');

// ─────────────────────────────────────────
// CREATE BOOKING REQUEST
// ─────────────────────────────────────────
const createBooking = async (req, res) => {
  const { worker_id, group_id, service_type, booking_type, scheduled_time, total_amount, latitude, longitude, address, notes } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!service_type || !address) {
    return res.status(400).json({ error: 'Mandatory fields missing. Please provide service_type and address.' });
  }

  try {
    // 1. Verify wallet has enough funds
    const walletRes = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    const wallet = walletRes.rows[0];
    const amount = parseFloat(total_amount || 0.00);

    if (!wallet || parseFloat(wallet.balance) < amount) {
      return res.status(400).json({ 
        error: `Insufficient wallet balance. You have ₹${Number(wallet?.balance || 0).toFixed(2)}, but this booking requires ₹${amount.toFixed(2)}. Top up your wallet first!` 
      });
    }

    // 2. Role-specific columns
    const customerId = userRole === 'customer' ? userId : null;
    const contractorId = userRole === 'contractor' ? userId : null;

    // 3. Fetch customer info to embed in booking
    const customerRes = await db.query('SELECT full_name, name, phone FROM users WHERE id = $1', [userId]);
    const customerInfo = customerRes.rows[0];

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Create booking record
    const result = await db.query(
      `INSERT INTO bookings 
        (customer_id, contractor_id, worker_id, group_id, service_type, booking_type, scheduled_time, total_amount, payment_status, otp, otp_verified, latitude, longitude, address, status, customer_name, customer_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, false, $10, $11, $12, 'pending', $13, $14)
       RETURNING *`,
      [
        customerId, contractorId, 
        worker_id || null, group_id || null, 
        service_type, booking_type || 'instant', 
        scheduled_time || new Date(), 
        amount, otp, 
        latitude ? parseFloat(latitude) : 18.5204, 
        longitude ? parseFloat(longitude) : 73.8567, 
        address,
        customerInfo?.full_name || customerInfo?.name || 'Customer',
        customerInfo?.phone || ''
      ]
    );

    const booking = result.rows[0];

    // 6. Send notifications & Real-time pings
    let targetId = null;

    if (worker_id) {
      targetId = worker_id;
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [worker_id, '🔔 New Booking Request!', `${booking_type === 'emergency' ? '🚨 SOS Emergency: ' : ''}${service_type} job from ${customerInfo?.full_name || 'a customer'} • ₹${amount.toFixed(2)}`, 'booking_request']
      );
      socketService.sendBookingPing(worker_id, booking);
    } else if (group_id) {
      const groupRes = await db.query('SELECT leader_id FROM groups WHERE id = $1', [group_id]);
      const leaderId = groupRes.rows[0]?.leader_id;
      if (leaderId) {
        targetId = leaderId;
        await db.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
          [leaderId, '🔔 Cooperative Project Invite!', `Your cooperative is invited for ${service_type} • ₹${amount.toFixed(2)}`, 'booking_request']
        );
        socketService.sendBookingPing(leaderId, booking);
      }
    }

    // 7. Refresh recipient's inbox
    const io = req.app.get('io');
    if (io && targetId) {
      io.to(`user:${targetId}`).emit('db-sync-refresh', { type: 'notifications' });
      io.to(`user:${targetId}`).emit('db-sync-refresh', { type: 'bookings' });
    }

    res.status(210).json({
      message: 'Booking request sent successfully. Waiting for worker response...',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error. Failed to initiate booking.' });
  }
};

// ─────────────────────────────────────────
// ACCEPT / REJECT BOOKING
// ─────────────────────────────────────────
const respondToBooking = async (req, res) => {
  const { bookingId, response } = req.body; // response: 'accept' | 'reject'
  const workerId = req.user.id;

  if (!bookingId || !response || !['accept', 'reject'].includes(response)) {
    return res.status(400).json({ error: 'Parameters missing. Provide bookingId and response (accept/reject).' });
  }

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const clientUserId = booking.customer_id || booking.contractor_id;
    const io = req.app.get('io');

    if (response === 'accept') {
      // Set to 'accepted' → worker is on the way
      await db.query("UPDATE bookings SET status = 'accepted', worker_id = $2 WHERE id = $1", [bookingId, workerId]);
      await db.query("UPDATE workers SET status = 'busy' WHERE user_id = $1", [workerId]);

      // Notify customer
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [clientUserId, '✅ Booking Accepted!', `Your ${booking.service_type} request has been accepted. Worker is heading your way!`, 'booking_accepted']
      );

      // Start GPS en-route simulation
      socketService.startEnRouteSimulation(bookingId, workerId, {
        latitude: parseFloat(booking.latitude || 18.5204),
        longitude: parseFloat(booking.longitude || 73.8567)
      });

      // Realtime events
      if (io) {
        io.to(`user:${clientUserId}`).emit('booking-accepted', { bookingId, workerId, message: 'Your worker accepted and is on the way!' });
        io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
        io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
        io.to(`user:${workerId}`).emit('db-sync-refresh', { type: 'bookings' });
      }

      const updatedBooking = (await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId])).rows[0];
      res.status(200).json({ message: 'Booking accepted! Head to the customer location.', booking: updatedBooking });
    } else {
      // Reject
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [bookingId]);
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
        [clientUserId, '❌ Booking Declined', 'Your booking request was declined. Try another provider.', 'booking_declined']
      );

      if (io) {
        io.to(`user:${clientUserId}`).emit('booking-rejected', { bookingId, message: 'Worker declined your request.' });
        io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
        io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
        io.to(`user:${workerId}`).emit('db-sync-refresh', { type: 'bookings' });
      }

      res.status(200).json({ message: 'Booking request declined.' });
    }
  } catch (error) {
    console.error('Respond to booking error:', error);
    res.status(500).json({ error: 'Server error. Failed to process booking response.' });
  }
};

// ─────────────────────────────────────────
// MARK WORKER ARRIVED AT LOCATION
// ─────────────────────────────────────────
const markArrived = async (req, res) => {
  const { bookingId } = req.body;
  const workerId = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.worker_id !== workerId) {
      return res.status(403).json({ error: 'Not authorized for this booking.' });
    }

    await db.query(
      "UPDATE bookings SET status = 'arrived', arrived_at = CURRENT_TIMESTAMP WHERE id = $1",
      [bookingId]
    );

    const clientUserId = booking.customer_id || booking.contractor_id;

    // Notify customer
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [clientUserId, '📍 Worker Arrived!', `Your ${booking.service_type} specialist has arrived at your location. Share your OTP to begin work.`, 'worker_arrived']
    );

    // Stop simulation — worker actually arrived
    socketService.stopEnRouteSimulation(bookingId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${clientUserId}`).emit('worker-arrived', { bookingId, message: 'Worker has arrived at your location!' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
      io.to(`user:${workerId}`).emit('db-sync-refresh', { type: 'bookings' });
    }

    const updated = (await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId])).rows[0];
    res.status(200).json({ message: 'Marked as arrived. Ask customer for their OTP to start work.', booking: updated });
  } catch (error) {
    console.error('Mark arrived error:', error);
    res.status(500).json({ error: 'Server error. Failed to mark arrival.' });
  }
};

// ─────────────────────────────────────────
// VERIFY OTP → START JOB
// ─────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { bookingId, otp } = req.body;
  const workerId = req.user.id;

  if (!bookingId || !otp) {
    return res.status(400).json({ error: 'bookingId and otp are required.' });
  }

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.worker_id !== workerId) {
      return res.status(403).json({ error: 'Not authorized for this booking.' });
    }

    // OTP comparison
    if (String(booking.otp).trim() !== String(otp).trim()) {
      console.log(`❌ [OTP] Mismatch: stored="${booking.otp}" vs entered="${otp}"`);
      return res.status(400).json({ error: 'Invalid OTP. Ask customer for the correct 6-digit code.' });
    }

    // Mark OTP verified + job started
    const result = await db.query(
      "UPDATE bookings SET status = 'started', otp_verified = true, started_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );

    const clientUserId = booking.customer_id || booking.contractor_id;

    // Notify customer
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [clientUserId, '🔧 Work Session Started!', `OTP verified! Your ${booking.service_type} work has officially begun.`, 'job_started']
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${clientUserId}`).emit('otp-verified', { bookingId, message: 'OTP verified! Work session started.' });
      io.to(`user:${clientUserId}`).emit('job-started', { bookingId });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
      io.to(`user:${workerId}`).emit('otp-verified', { bookingId });
      io.to(`user:${workerId}`).emit('db-sync-refresh', { type: 'bookings' });
    }

    console.log(`✅ [OTP] Verified for booking ${bookingId}. Work started.`);
    res.status(200).json({ message: 'OTP verified! Work session started successfully.', booking: result.rows[0] });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error. Failed to verify OTP.' });
  }
};

// ─────────────────────────────────────────
// START JOB (legacy — kept for compatibility)
// ─────────────────────────────────────────
const startJob = async (req, res) => {
  const { bookingId, otp } = req.body;
  const workerId = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please request the correct 6-digit start PIN from the client.' });
    }

    const result = await db.query(
      "UPDATE bookings SET status = 'started', otp_verified = true, started_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );

    const targetUserId = booking.customer_id || booking.contractor_id;
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [targetUserId, '🔧 Job In Progress', `Work has officially started for your ${booking.service_type} service!`, 'job_started']
    );

    socketService.stopEnRouteSimulation(bookingId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('job-started', { bookingId });
      io.to(`user:${targetUserId}`).emit('db-sync-refresh', { type: 'bookings' });
      io.to(`user:${workerId}`).emit('db-sync-refresh', { type: 'bookings' });
    }

    res.status(200).json({ message: 'OTP verified! Work session started.', booking: result.rows[0] });
  } catch (error) {
    console.error('Start job error:', error);
    res.status(500).json({ error: 'Server error. Failed to start work session.' });
  }
};

// ─────────────────────────────────────────
// COMPLETE JOB + WALLET SETTLEMENT
// ─────────────────────────────────────────
const completeJob = async (req, res) => {
  const { bookingId } = req.body;
  const workerId = req.user.id;

  try {
    const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

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
      [clientWallet.id, bookingId, payAmount, `Payment for ${booking.service_type} service`]
    );

    // 4. Credit worker / split group
    if (booking.worker_id) {
      const workerWalletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [booking.worker_id]);
      const workerWallet = workerWalletRes.rows[0];
      if (workerWallet) {
        const newWorkerBal = parseFloat(workerWallet.balance) + payAmount;
        await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newWorkerBal, workerWallet.id]);
        await db.query(
          "INSERT INTO transactions (wallet_id, booking_id, type, amount, description) VALUES ($1, $2, 'credit', $3, $4)",
          [workerWallet.id, bookingId, payAmount, `Earning from ${booking.service_type} job`]
        );
      }
      await db.query(
        "UPDATE workers SET status = 'online', completed_jobs_count = completed_jobs_count + 1 WHERE user_id = $1",
        [booking.worker_id]
      );
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
              [wWallet.id, bookingId, splitAmount, `Cooperative earnings split for ${booking.service_type}`]
            );
          }
          await db.query(
            "UPDATE workers SET status = 'online', completed_jobs_count = completed_jobs_count + 1 WHERE user_id = $1",
            [member.worker_id]
          );
        }
      }
    }

    // 5. Notify client
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [clientUserId, '🎉 Service Complete & Paid', `Your ${booking.service_type} is done. ₹${payAmount.toFixed(2)} debited from wallet.`, 'booking_completed']
    );

    socketService.stopEnRouteSimulation(bookingId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${clientUserId}`).emit('job-completed', { bookingId });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'bookings' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'notifications' });
      io.to(`user:${clientUserId}`).emit('db-sync-refresh', { type: 'wallet' });

      if (booking.worker_id) {
        io.to(`user:${booking.worker_id}`).emit('payment-released', { bookingId, amount: payAmount });
        io.to(`user:${booking.worker_id}`).emit('db-sync-refresh', { type: 'bookings' });
        io.to(`user:${booking.worker_id}`).emit('db-sync-refresh', { type: 'wallet' });
      }
    }

    res.status(200).json({ 
      message: 'Job completed! Wallet payment settled successfully.', 
      booking: updatedBookingRes.rows[0] 
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ error: 'Server error. Failed to finalize service completion.' });
  }
};

// ─────────────────────────────────────────
// GET MY BOOKINGS (Role-based)
// ─────────────────────────────────────────
const getMyBookings = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let queryText = '';
    let params = [userId];

    if (role === 'customer') {
      queryText = `
        SELECT b.*, 
          u.name as worker_name, u.full_name as worker_full_name,
          u.avatar_url as worker_avatar, u.phone as worker_phone
        FROM bookings b
        LEFT JOIN users u ON b.worker_id = u.id
        WHERE b.customer_id = $1
        ORDER BY b.created_at DESC
      `;
    } else if (role === 'contractor') {
      queryText = `
        SELECT b.*, 
          u.name as worker_name, u.avatar_url as worker_avatar, 
          g.name as group_name
        FROM bookings b
        LEFT JOIN users u ON b.worker_id = u.id
        LEFT JOIN groups g ON b.group_id = g.id
        WHERE b.contractor_id = $1
        ORDER BY b.created_at DESC
      `;
    } else if (role === 'worker') {
      queryText = `
        SELECT b.*, 
          uc.name as customer_name_join, uc.full_name as customer_full_name,
          uc.avatar_url as customer_avatar, uc.phone as customer_phone_join
        FROM bookings b
        LEFT JOIN users uc ON COALESCE(b.customer_id, b.contractor_id) = uc.id
        WHERE b.worker_id = $1 OR b.group_id IN (
          SELECT group_id FROM group_members WHERE worker_id = $1
        )
        ORDER BY b.created_at DESC
      `;
    } else {
      queryText = `
        SELECT b.*, uc.name as customer_name_join, uw.name as worker_name
        FROM bookings b
        LEFT JOIN users uc ON b.customer_id = uc.id
        LEFT JOIN users uw ON b.worker_id = uw.id
        ORDER BY b.created_at DESC
      `;
      params = [];
    }

    const result = await db.query(queryText, params);
    
    // Normalize customer name field
    const rows = result.rows.map(b => ({
      ...b,
      customer_name: b.customer_name || b.customer_name_join || b.customer_full_name || 'Customer',
      customer_phone: b.customer_phone || b.customer_phone_join || ''
    }));

    res.status(200).json(rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve booking logs.' });
  }
};

// ─────────────────────────────────────────
// ADD REVIEW
// ─────────────────────────────────────────
const addReview = async (req, res) => {
  const { bookingId, revieweeId, rating, comment } = req.body;
  const reviewerId = req.user.id;

  if (!bookingId || !revieweeId || !rating) {
    return res.status(400).json({ error: 'Please supply bookingId, revieweeId, and rating (1-5).' });
  }

  try {
    const result = await db.query(
      'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [bookingId, reviewerId, revieweeId, rating, comment]
    );

    const avgRes = await db.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = $1',
      [revieweeId]
    );
    const avgRating = parseFloat(avgRes.rows[0].avg_rating || 5.00);
    await db.query('UPDATE workers SET rating = $1 WHERE user_id = $2', [avgRating, revieweeId]);

    res.status(210).json({ message: 'Review posted!', review: result.rows[0] });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error. Failed to save review.' });
  }
};

module.exports = {
  createBooking,
  respondToBooking,
  markArrived,
  verifyOTP,
  startJob,
  completeJob,
  getMyBookings,
  addReview
};
