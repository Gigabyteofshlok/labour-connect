// ADMIN PORTAL & MONITORING CONTROLLER
// Directs worker document approvals, fraud risk metrics, and platform usage analytics.

const db = require('../config/db');

// Approve worker profile documents
const verifyWorker = async (req, res) => {
  const { workerId, approve } = req.body; // approve: true or false

  if (!workerId) {
    return res.status(400).json({ error: 'Please supply a worker ID.' });
  }

  const status = approve ? 'approved' : 'rejected';
  const verified = !!approve;

  try {
    const result = await db.query(
      `UPDATE workers 
       SET verified = $1, verification_status = $2 
       WHERE user_id = $3 RETURNING *`,
      [verified, status, workerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Worker profile record not found.' });
    }

    // Send notifications to worker
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [
        workerId, 
        approve ? 'Profile Verified!' : 'Verification Update', 
        approve 
          ? 'Congratulations! Your profile has been verified by the admin team. You can now accept customer orders!' 
          : 'Your document verification has been rejected. Please re-upload clear government papers.',
        'alert'
      ]
    );

    res.status(200).json({
      message: `Worker verification status set to '${status}' successfully.`,
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Verify worker error:', error);
    res.status(500).json({ error: 'Server error. Verification status update failed.' });
  }
};

// Retrieve all workers waiting for approvals
const getPendingWorkers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id as user_id, u.name, u.email, u.phone, u.avatar_url,
             w.skills, w.experience_years, w.hourly_rate, w.verification_status, w.identity_proof_url
      FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.verification_status = 'pending'
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get pending workers error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve pending verification queue.' });
  }
};

// Retrieve platform metrics (User distributions, bookings completion rate, money processed)
const getPlatformStats = async (req, res) => {
  try {
    const usersRes = await db.query('SELECT COUNT(*) as count, role FROM users GROUP BY role');
    const bookingsRes = await db.query('SELECT COUNT(*) as count, status FROM bookings GROUP BY status');
    const moneyRes = await db.query('SELECT SUM(amount) as volume FROM transactions WHERE type = \'debit\'');

    // Default structure for statistics
    const stats = {
      users: { customer: 0, worker: 0, contractor: 0, admin: 0 },
      bookings: { pending: 0, accepted: 0, started: 0, completed: 0, cancelled: 0 },
      processedVolume: parseFloat(moneyRes.rows[0]?.volume || 0.00)
    };

    usersRes.rows.forEach(r => {
      if (stats.users[r.role] !== undefined) {
        stats.users[r.role] = parseInt(r.count);
      }
    });

    bookingsRes.rows.forEach(r => {
      if (stats.bookings[r.status] !== undefined) {
        stats.bookings[r.status] = parseInt(r.count);
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Server error. Failed to load administrative metrics.' });
  }
};

module.exports = {
  verifyWorker,
  getPendingWorkers,
  getPlatformStats
};
