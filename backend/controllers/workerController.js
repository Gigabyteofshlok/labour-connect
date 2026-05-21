// WORKER MANAGEMENT & DISCOVERY CONTROLLER
// Handles finding nearby workers, skill filtering, updating online status, and updating locations.

const db = require('../config/db');

// Retrieve all workers, filtered by skill and status, with distance calculations
const getNearbyWorkers = async (req, res) => {
  const { latitude, longitude, skill, maxDistance = 10 } = req.query; // Max distance in kilometers

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude query parameters are required for nearby worker search.' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const distLimit = parseFloat(maxDistance);

  try {
    // Standard PostgreSQL radial query using Haversine formula, fallback handles mock queries gracefully
    // Returns distance in KM
    let queryText = `
      SELECT 
        u.id as user_id, u.name, u.phone, u.avatar_url,
        w.skills, w.experience_years, w.hourly_rate, w.bio, w.status, w.rating, w.completed_jobs_count, w.verified,
        wl.latitude, wl.longitude,
        (6371 * acos(
          cos(radians($1)) * cos(radians(wl.latitude)) * cos(radians(wl.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(wl.latitude))
        )) AS distance
      FROM workers w
      JOIN users u ON w.user_id = u.id
      JOIN worker_locations wl ON w.user_id = wl.worker_id
      WHERE w.status = 'online'
    `;
    
    let params = [lat, lng];

    // If filtering by skill
    if (skill) {
      queryText += ` AND $3 = ANY(w.skills)`;
      params.push(skill);
    }

    queryText += ` ORDER BY distance ASC`;

    const result = await db.query(queryText, params);

    // Fetch active bookings to compute today's schedules
    const activeBookingsRes = await db.query(
      "SELECT id, worker_id, scheduled_time, status, service_type FROM bookings WHERE status != 'completed' AND status != 'cancelled'"
    );
    const activeBookings = activeBookingsRes.rows || [];

    // If database queries fail or mock mode is active, our custom db.query automatically falls back
    // Let's filter by distance in JS just as double protection for mock mode compatibility
    let workers = result.rows.map(w => {
      const workerActiveBookings = activeBookings.filter(b => b.worker_id === w.user_id);
      
      // Calculate booked slots today (from start time to end time, assuming 2 hours duration)
      const bookedSlots = workerActiveBookings.map(b => {
        const startTime = new Date(b.scheduled_time);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
        return {
          id: b.id,
          service_type: b.service_type,
          status: b.status,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          formatted: `${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        };
      });

      return {
        ...w,
        distance: w.distance ? parseFloat(w.distance) : parseFloat((Math.sqrt(Math.pow(w.latitude - lat, 2) + Math.pow(w.longitude - lng, 2)) * 111.32).toFixed(2)),
        active_bookings: bookedSlots
      };
    });

    // Filter by max distance if requested
    workers = workers.filter(w => w.distance <= distLimit);

    res.status(200).json(workers);
  } catch (error) {
    console.error('Nearby workers error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve nearby workers.' });
  }
};

// Toggle Worker Availability Status (online/offline)
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const workerId = req.user.id;

  if (!status || !['online', 'offline', 'busy'].includes(status)) {
    return res.status(400).json({ error: 'Invalid worker status. Supported statuses: online, offline, busy.' });
  }

  try {
    const result = await db.query(
      'UPDATE workers SET status = $1 WHERE user_id = $2 RETURNING *',
      [status, workerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    res.status(200).json({
      message: `Status updated successfully! You are now ${status}.`,
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error. Failed to toggle status.' });
  }
};

// Update worker live location (lat, lng)
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const workerId = req.user.id;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Please supply both latitude and longitude coordinates.' });
  }

  try {
    await db.query(
      'UPDATE worker_locations SET latitude = $1, longitude = $2, last_updated = CURRENT_TIMESTAMP WHERE worker_id = $3',
      [parseFloat(latitude), parseFloat(longitude), workerId]
    );

    res.status(200).json({ message: 'Live GPS location updated successfully.' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Server error. Failed to update coordinates.' });
  }
};

// Update worker profile variables (skills, hourly rate, bio, experience)
const updateProfile = async (req, res) => {
  const { skills, experience_years, hourly_rate, bio } = req.body;
  const workerId = req.user.id;

  try {
    const result = await db.query(
      `UPDATE workers 
       SET skills = COALESCE($1, skills), 
           experience_years = COALESCE($2, experience_years), 
           hourly_rate = COALESCE($3, hourly_rate), 
           bio = COALESCE($4, bio) 
       WHERE user_id = $5 RETURNING *`,
      [skills, experience_years, hourly_rate, bio, workerId]
    );

    res.status(200).json({
      message: 'Worker details updated successfully!',
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Update worker profile error:', error);
    res.status(500).json({ error: 'Server error. Failed to edit profile details.' });
  }
};

module.exports = {
  getNearbyWorkers,
  updateStatus,
  updateLocation,
  updateProfile
};
