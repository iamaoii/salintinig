const supabase = require('../config/supabase.js');

/**
 * Middleware to verify JWT / Bearer auth token
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Attempt Supabase token verification if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'teacher',
            name: user.user_metadata?.name || 'User',
          };
          return next();
        }
      } catch (err) {
        console.warn('Supabase token verification fallback:', err.message);
      }
    }

    // Mock / Demo Fallback token parser
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (decoded && decoded.username) {
        req.user = decoded;
        return next();
      }
    } catch (e) {
      // Invalid token format
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token.',
    });
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

    if (!allowedRoles.includes(req.user.role)) {
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
