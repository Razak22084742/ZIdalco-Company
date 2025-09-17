const { authMiddleware } = require('./../videos/middleware/auth');

// Allowlist of admin emails (comma-separated in env). Defaults to the primary admin.
const ALLOWED_ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || 'zidalcoltd@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Admin-only middleware that extends the base auth middleware
function adminOnlyMiddleware(req, res, next) {
  // First run the base authentication
  authMiddleware(req, res, (err) => {
    if (err) return next(err);

    const userEmail = (req.user && req.user.email && String(req.user.email).toLowerCase()) || '';
    const userRole = (req.user && (req.user.role || req.user.user_metadata?.role)) || '';

    // Authorize if user's email is allowlisted OR Supabase metadata indicates admin role
    const allowlisted = userEmail && ALLOWED_ADMIN_EMAILS.includes(userEmail);
    const hasAdminRole = String(userRole).toLowerCase() === 'admin';

    if (!allowlisted && !hasAdminRole) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Optionally set role hint for downstream handlers
    if (!req.user.role) req.user.role = 'admin';

    next();
  });
}

module.exports = { adminOnlyMiddleware };
