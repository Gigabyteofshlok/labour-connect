// AUTHENTICATION MIDDLEWARE
// Verifies JWT token and enforces role-based endpoint permissions.

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

// Verify Token and attach User details to Request object
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Expected format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Session expired or invalid authentication token.' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authentication token is required to access this resource.' });
  }
};

// Check if authenticated user has one of the allowed roles
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { role } = req.user;
    if (allowedRoles.includes(role)) {
      next();
    } else {
      res.status(403).json({ 
        error: `Access Denied. Your role '${role}' does not have sufficient permissions to perform this action.` 
      });
    }
  };
};

module.exports = {
  authenticateJWT,
  requireRole
};
