const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REGISTER USER

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      name,
      phone
    } = req.body;

    if (!email || !password || !role || !name || !phone) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await db.query(
      `INSERT INTO users
      (email, password_hash, role, name, phone)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, email, role, name, phone`,
      [
        normalizedEmail,
        hashedPassword,
        role,
        name,
        phone
      ]
    );

    const user = userResult.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      error: error.message
    });
  }
};

// LOGIN USER
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      error: 'Login failed.'
    });
  }
};

// FETCH CURRENT USER
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, name, phone, avatar_url
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('GET ME ERROR:', error);

    return res.status(500).json({
      error: 'Failed to fetch user profile.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};