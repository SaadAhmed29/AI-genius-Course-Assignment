const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

// protect
// Reads the Authorization: Bearer <token> header, verifies the signature, and
// attaches the decoded user payload to req.user so downstream handlers can use it.

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  // Header must look like "Bearer eyJ..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status:  'error',
      message: 'No token provided. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify throws if the token is expired, malformed, or has a bad signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the payload so route handlers can read req.user.role, req.user.id, etc.
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status:  'error',
        message: 'Access token has expired. Use /api/auth/refresh to get a new one.',
      });
    }

    return res.status(401).json({
      status:  'error',
      message: 'Invalid token. Please log in again.',
    });
  }
}

// restrictTo
// Middleware factory — call it with the roles that are allowed to hit the route.
// Example usage:  router.delete('/purge-cache', protect, restrictTo('Admin'), handler)

function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    // protect() must run before this middleware so req.user is populated
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status:  'error',
        message: `Access denied. This endpoint is restricted to: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
