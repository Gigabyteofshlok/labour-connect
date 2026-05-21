// COOPERATIVE LABOUR GROUP CONTROLLER
// Directs group creation, team building, contractor team analytics, and project attendance logs.

const db = require('../config/db');

// Create a new cooperative Labour Group
const createGroup = async (req, res) => {
  const { name, description } = req.body;
  const workerId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Please enter a name for your cooperative labour team.' });
  }

  try {
    // Check if worker already has a group
    const workerCheck = await db.query('SELECT group_id FROM workers WHERE user_id = $1', [workerId]);
    if (workerCheck.rows[0]?.group_id) {
      return res.status(400).json({ error: 'You are already a member of another group. Leave it first to start a new one.' });
    }

    // Insert group
    const groupRes = await db.query(
      'INSERT INTO groups (name, description, leader_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', workerId]
    );

    const newGroup = groupRes.rows[0];

    // Assign worker to group & add to members list
    await db.query('UPDATE workers SET group_id = $1 WHERE user_id = $2', [newGroup.id, workerId]);
    await db.query('INSERT INTO group_members (group_id, worker_id) VALUES ($1, $2)', [newGroup.id, workerId]);

    res.status(210).json({
      message: `Cooperative group '${name}' successfully formed! You are the leader.`,
      group: newGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error. Failed to form cooperative team.' });
  }
};

// Join a cooperative group
const joinGroup = async (req, res) => {
  const { groupId } = req.body;
  const workerId = req.user.id;

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required to join.' });
  }

  try {
    // Check if worker is in a group
    const workerCheck = await db.query('SELECT group_id FROM workers WHERE user_id = $1', [workerId]);
    if (workerCheck.rows[0]?.group_id) {
      return res.status(400).json({ error: 'You are already in a cooperative group. Exit your current group first.' });
    }

    // Check if group exists
    const groupRes = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cooperative group not found.' });
    }

    // Join
    await db.query('UPDATE workers SET group_id = $1 WHERE user_id = $2', [groupId, workerId]);
    await db.query('INSERT INTO group_members (group_id, worker_id) VALUES ($1, $2)', [groupId, workerId]);

    res.status(200).json({
      message: 'Joined cooperative group successfully! You can now receive joint contractor orders.',
      group: groupRes.rows[0]
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Server error. Failed to join cooperative group.' });
  }
};

// Leave a cooperative group
const leaveGroup = async (req, res) => {
  const workerId = req.user.id;

  try {
    const workerCheck = await db.query('SELECT group_id FROM workers WHERE user_id = $1', [workerId]);
    const groupId = workerCheck.rows[0]?.group_id;

    if (!groupId) {
      return res.status(400).json({ error: 'You are not currently a member of any cooperative group.' });
    }

    // Check if worker is leader
    const groupRes = await db.query('SELECT leader_id FROM groups WHERE id = $1', [groupId]);
    const isLeader = groupRes.rows[0]?.leader_id === workerId;

    if (isLeader) {
      return res.status(400).json({ 
        error: 'As the leader, you cannot leave the group. Disband or delegate leadership first.' 
      });
    }

    // Leave group
    await db.query('UPDATE workers SET group_id = NULL WHERE user_id = $1', [workerId]);
    await db.query('DELETE FROM group_members WHERE group_id = $1 AND worker_id = $2', [groupId, workerId]);

    res.status(200).json({ message: 'Successfully exited cooperative group.' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Server error. Failed to exit cooperative.' });
  }
};

// List all groups
const getAllGroups = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT g.*, u.name as leader_name, COUNT(gm.worker_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.leader_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, u.name
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve cooperative groups.' });
  }
};

// Log Daily Attendance (For contractor projects)
const logAttendance = async (req, res) => {
  const { bookingId, workerId, date, status } = req.body;

  if (!bookingId || !workerId || !status) {
    return res.status(400).json({ error: 'Please supply bookingId, workerId, and attendance status (present/absent/late).' });
  }

  const currentDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await db.query(
      `INSERT INTO attendance (booking_id, worker_id, date, status, check_in_time) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (booking_id, worker_id, date) 
       DO UPDATE SET status = EXCLUDED.status, check_in_time = CURRENT_TIMESTAMP
       RETURNING *`,
      [bookingId, workerId, currentDate, status]
    );

    res.status(200).json({
      message: 'Attendance record saved successfully.',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Log attendance error:', error);
    res.status(500).json({ error: 'Server error. Failed to register attendance log.' });
  }
};

// Get attendance logs
const getAttendance = async (req, res) => {
  const { bookingId } = req.query;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required.' });
  }

  try {
    const result = await db.query(
      `SELECT a.*, u.name as worker_name, u.avatar_url
       FROM attendance a
       JOIN users u ON a.worker_id = u.id
       WHERE a.booking_id = $1
       ORDER BY a.date DESC`,
      [bookingId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Server error. Failed to load attendance logs.' });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  leaveGroup,
  getAllGroups,
  logAttendance,
  getAttendance
};
