// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5; // Maximum attempts per IP
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes lockout

function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
}

function isRateLimited(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  
  // Check if currently locked out
  if (attempts.lockedUntil > now) {
    return { limited: true, remainingTime: attempts.lockedUntil - now };
  }
  
  // Reset if window has passed
  if (now - attempts.firstAttempt > WINDOW_MS) {
    attempts.count = 0;
    attempts.firstAttempt = now;
    attempts.lockedUntil = 0;
  }
  
  // Check if exceeded max attempts
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_MS;
    loginAttempts.set(ip, attempts);
    return { limited: true, remainingTime: LOCKOUT_MS };
  }
  
  return { limited: false, remainingTime: 0 };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  
  // Reset if window has passed
  if (now - attempts.firstAttempt > WINDOW_MS) {
    attempts.count = 0;
    attempts.firstAttempt = now;
    attempts.lockedUntil = 0;
  }
  
  attempts.count++;
  loginAttempts.set(ip, attempts);
}

function recordSuccessfulLogin(ip) {
  // Clear attempts on successful login
  loginAttempts.delete(ip);
}

function loginRateLimiter(req, res, next) {
  const ip = getClientIP(req);
  const rateLimit = isRateLimited(ip);
  
  if (rateLimit.limited) {
    const minutes = Math.ceil(rateLimit.remainingTime / (60 * 1000));
    return res.status(429).json({
      error: true,
      message: `Too many login attempts. Please try again in ${minutes} minutes.`,
      retryAfter: minutes
    });
  }
  
  // Store the IP in the request for later use
  req.clientIP = ip;
  next();
}

module.exports = {
  loginRateLimiter,
  recordFailedAttempt,
  recordSuccessfulLogin
};
