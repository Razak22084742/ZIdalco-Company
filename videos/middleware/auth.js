const { getUserFromAccessToken } = require('../../utils/supabaseClient');
const { findUserByEmail } = require('../../utils/userDatabase');
const USE_MOCK = String(process.env.SUPABASE_MOCK).toLowerCase() === 'true' || !process.env.SUPABASE_URL;

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Authorization token required' });
  }
  const accessToken = authHeader.slice(7);
  try {
    if (USE_MOCK) {
      // Decode the token to get email and timestamp
      try {
        const decoded = Buffer.from(accessToken, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        
        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > maxAge) {
          return res.status(401).json({ error: true, message: 'Token expired' });
        }
        
        // Find user by email
        const user = findUserByEmail(email);
        if (!user) {
          return res.status(401).json({ error: true, message: 'Invalid token' });
        }
        
        // Set user in request
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
        
        next();
      } catch (decodeError) {
        return res.status(401).json({ error: true, message: 'Invalid token format' });
      }
    } else {
      const { user, error } = await getUserFromAccessToken(accessToken);
      if (error || !user) {
        return res.status(401).json({ error: true, message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware };
