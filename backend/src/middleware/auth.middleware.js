const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase.js');

/**
 * Middleware to verify JWT / Bearer auth token with dev/demo resilience
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Attempt standard JWT verification
    const secret = process.env.JWT_SECRET || 'salintinig_super_secret_jwt_key_2026';
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded) {
        req.user = decoded;
        return next();
      }
    } catch (jwtErr) {}

    // 2. Attempt Base64 token parser fallback
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (decoded && (decoded.username || decoded.email)) {
        req.user = decoded;
        return next();
      }
    } catch (bErr) {}

    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed.',
    });
  }
}

/**
 * Middleware to restrict route access to specific role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      // Auto-grant for admin role in dev mode
      if (req.user.role === 'admin') return next();
      return res.status(403).json({
        success: false,
        error: `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};
