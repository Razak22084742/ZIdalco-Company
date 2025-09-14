const { authMiddleware } = require('./../videos/middleware/auth');

// Admin-only middleware that extends the base auth middleware
function adminOnlyMiddleware(req, res, next) {
  // First run the base authentication
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: true, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    // Additional check: ensure it's the specific admin account
    if (req.user.email !== 'admin@zidalco.com') {
      return res.status(403).json({ 
        error: true, 
        message: 'Access denied. Invalid admin account.' 
      });
    }
    
    next();
  });
}

module.exports = { adminOnlyMiddleware };
