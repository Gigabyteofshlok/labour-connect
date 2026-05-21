// AUTHENTICATION CONTROLLER
// Handles user signup, password hashing, role creation, and JWT token issuance.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

// Helper Function: Retrieve completely hydrated user profile using unified LEFT JOIN queries
const getFullProfile = async (userId, role) => {
  console.log(`🔍 [PROFILE HYDRATION] Hydrating profile for userId: ${userId}, role: ${role}`);
  let queryText = '';
  
  if (role === 'customer') {
    queryText = `
      SELECT u.id, u.email, u.role, u.name, u.full_name, u.phone, u.avatar_url, u.created_at,
             c.bio, c.favorite_workers, c.address
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      WHERE u.id = $1
    `;
  } else if (role === 'worker') {
    queryText = `
      SELECT u.id, u.email, u.role, u.name, u.full_name, u.phone, u.avatar_url, u.created_at,
             w.skills, w.experience_years, w.hourly_rate, w.bio, w.status, w.rating, w.completed_jobs_count, w.group_id, w.verified, w.verification_status
      FROM users u
      LEFT JOIN workers w ON u.id = w.user_id
      WHERE u.id = $1
    `;
  } else if (role === 'contractor') {
    queryText = `
      SELECT u.id, u.email, u.role, u.name, u.full_name, u.phone, u.avatar_url, u.created_at,
             t.company_name, t.projects_count
      FROM users u
      LEFT JOIN contractors t ON u.id = t.user_id
      WHERE u.id = $1
    `;
  } else {
    queryText = `
      SELECT u.id, u.email, u.role, u.name, u.full_name, u.phone, u.avatar_url, u.created_at
      FROM users u
      WHERE u.id = $1
    `;
  }

  const result = await db.query(queryText, [userId]);
  if (result.rows.length === 0) {
    console.warn(`⚠️ [PROFILE HYDRATION] Profile not found in database for userId: ${userId}`);
    return null;
  }
  const user = result.rows[0];
  user.full_name = user.full_name || user.name;
  user.profile_image = user.avatar_url;
  console.log(`✨ [PROFILE HYDRATION] Hydration success! full_name: "${user.full_name}", role: "${user.role}"`);
  return user;
};

// User Registration
const register = async (req, res) => {
  const { email, password, role, name, phone, avatar_url, bio, address, skills, experience_years, hourly_rate, company_name } = req.body;

  if (!email || !password || !role || !name || !phone) {
    return res.status(400).json({ error: 'Please provide all mandatory fields: email, password, role, name, phone.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`📝 [AUTH] Registering user with email: ${normalizedEmail}, role: ${role}`);

    // Check if user already exists
    const checkUser = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2', [normalizedEmail, phone]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email or phone number is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into main table
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash, role, name, full_name, phone, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role, name, full_name, phone, avatar_url',
      [normalizedEmail, passwordHash, role, name, name, phone, avatar_url]
    );

    const newUser = userResult.rows[0];
    const userId = newUser.id;

    // Insert child record depending on the selected user role
    if (role === 'customer') {
      await db.query(
        'INSERT INTO customers (user_id, bio, address) VALUES ($1, $2, $3)',
        [userId, bio || 'Hey, I am using Labour Connect!', address || '']
      );
    } else if (role === 'worker') {
      await db.query(
        'INSERT INTO workers (user_id, skills, experience_years, hourly_rate, bio) VALUES ($1, $2, $3, $4, $5)',
        [userId, skills || [], experience_years || 0, hourly_rate || 0.00, bio || '']
      );
      // Initialize location
      await db.query(
        'INSERT INTO worker_locations (worker_id, latitude, longitude) VALUES ($1, $2, $3)',
        [userId, 18.5204, 73.8567] // Default coordinates near Pune center
      );
    } else if (role === 'contractor') {
      await db.query(
        'INSERT INTO contractors (user_id, company_name) VALUES ($1, $2)',
        [userId, company_name || '']
      );
    }

    // Retrieve fully hydrated user details
    const fullUser = await getFullProfile(userId, role);

    // Generate JWT token
    const token = jwt.sign(
      { id: fullUser.id, email: fullUser.email, role: fullUser.role, name: fullUser.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✨ [AUTH] Registration complete! Saved profile for "${fullUser.full_name}"`);

    res.status(210).json({
      message: 'Account created successfully!',
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error occurred during account creation. Please try again.' });
  }
};

// User Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both your email address and password.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔐 [AUTH] Login attempt received for normalized email: "${normalizedEmail}"`);
    
    // Retrieve user details with case-insensitive lower match
    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (result.rows.length === 0) {
      console.warn(`⚠️ [AUTH] Login failed: User not found for email "${normalizedEmail}"`);
      return res.status(400).json({ error: 'Invalid login credentials. User not found.' });
    }

    const user = result.rows[0];
    console.log(`🔐 [AUTH] DB user lookup match found. name: "${user.name}", role: "${user.role}", stored hash: "${user.password_hash.substring(0, 10)}..."`);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log(`🔐 [AUTH] Password comparison result: ${isMatch}`);
    if (!isMatch) {
      console.warn(`⚠️ [AUTH] Login failed: Incorrect password for email "${normalizedEmail}"`);
      return res.status(400).json({ error: 'Invalid login credentials. Incorrect password.' });
    }

    // Retrieve fully hydrated user profile
    const fullUser = await getFullProfile(user.id, user.role);

    // Generate JWT token
    const token = jwt.sign(
      { id: fullUser.id, email: fullUser.email, role: fullUser.role, name: fullUser.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✨ [AUTH] Login successful! User: "${fullUser.full_name}" (${fullUser.role})`);

    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({ error: 'Server error occurred during login. Please try again.', message: error.message });
  }
};

// Get current user profile details
const getMe = async (req, res) => {
  try {
    console.log(`🔍 [AUTH] Fetching current user session profile for userId: ${req.user.id}`);
    
    // Retrieve user basic details to obtain role
    const basicResult = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (basicResult.rows.length === 0) {
      console.warn(`⚠️ [AUTH] getMe session validation failed: User not found for id: ${req.user.id}`);
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { role } = basicResult.rows[0];
    const fullUser = await getFullProfile(req.user.id, role);

    if (!fullUser) {
      return res.status(404).json({ error: 'User profile hydration failed.' });
    }

    res.status(200).json(fullUser);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve profile.' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
