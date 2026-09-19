const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'salintinig-secret-key-2024';

/**
 * Middleware: verifyToken
 * Verifies the Bearer JWT token in the Authorization header.
 * Attaches decoded user data to req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
}

// Alias for backward compatibility
const authenticateToken = verifyToken;

/**
 * Middleware: requireRole
 * Checks that req.user.role exactly matches the required role(s).
 * Accepts a string or array of allowed roles.
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowed.join(' or ')}.`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, authenticateToken, requireRole };
