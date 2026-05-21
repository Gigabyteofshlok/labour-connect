// INSTANT CHATS & REAL-TIME NOTIFICATIONS CONTROLLER
// Directs message storage, transcripts query, and notification updates.

const db = require('../config/db');

// Send chat message
const sendMessage = async (req, res) => {
  const { bookingId, receiverId, message } = req.body;
  const senderId = req.user.id;

  if (!bookingId || !receiverId || !message) {
    return res.status(400).json({ error: 'Please supply bookingId, receiverId, and a text message.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO chats (booking_id, sender_id, receiver_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [bookingId, senderId, receiverId, message]
    );

    res.status(210).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error. Failed to send chat message.' });
  }
};

// Fetch chat transcript for a booking
const getChatTranscript = async (req, res) => {
  const { bookingId } = req.query;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required.' });
  }

  try {
    const result = await db.query(
      `SELECT c.*, us.name as sender_name, us.avatar_url as sender_avatar
       FROM chats c
       JOIN users us ON c.sender_id = us.id
       WHERE c.booking_id = $1
       ORDER BY c.created_at ASC`,
      [bookingId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve chat transcript.' });
  }
};

// Retrieve user notifications
const getMyNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error. Failed to load notifications.' });
  }
};

// Mark notifications as read
const markNotificationsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error. Failed to update notification flags.' });
  }
};

module.exports = {
  sendMessage,
  getChatTranscript,
  getMyNotifications,
  markNotificationsRead
};
