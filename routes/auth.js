const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const { authenticateUser, createUser } = require('../utils/userDatabase');
const { loginRateLimiter, recordFailedAttempt, recordSuccessfulLogin } = require('../utils/rateLimiter');
const axios = require('axios');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const USE_MOCK = String(process.env.SUPABASE_MOCK).toLowerCase() === 'true' || !SUPABASE_URL;

// POST /api/auth/login using proper authentication
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required' });
    }

    if (USE_MOCK) {
      // Use local user database for authentication
      const authResult = await authenticateUser(email, password);
      if (!authResult.success) {
        // Record failed attempt
        recordFailedAttempt(req.clientIP);
        return res.status(401).json({ error: true, message: authResult.message });
      }
      
      // Record successful login
      recordSuccessfulLogin(req.clientIP);
      
      // Generate a simple token (in production, use JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      return res.json({ 
        success: true, 
        message: 'Login successful', 
        token: token, 
        admin: authResult.user 
      });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        recordFailedAttempt(req.clientIP);
        return res.status(401).json({ error: true, message: error.message });
      }
      recordSuccessfulLogin(req.clientIP);
      return res.json({ success: true, message: 'Login successful', token: data.session.access_token, admin: { id: data.user?.id, name: data.user?.user_metadata?.name, email } });
    } catch (e) {
      // Fallback to REST if fetch failed
      if (String(e?.message || '').includes('fetch failed')) {
        try {
          const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
          const resp = await axios.post(url, { email, password }, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } });
          if (resp.status >= 200 && resp.status < 300) {
            const d = resp.data;
            recordSuccessfulLogin(req.clientIP);
            return res.json({ success: true, message: 'Login successful', token: d.access_token, admin: { id: d.user?.id, name: d.user?.user_metadata?.name, email } });
          }
          recordFailedAttempt(req.clientIP);
          return res.status(401).json({ error: true, message: 'Invalid credentials' });
        } catch (restErr) {
          console.error('Login REST fallback error:', restErr?.response?.data || restErr?.message);
          recordFailedAttempt(req.clientIP);
          return res.status(400).json({ error: true, message: 'Login failed' });
        }
      }
      recordFailedAttempt(req.clientIP);
      throw e;
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: 'Login failed' });
  }
});

// POST /api/auth/signup - DISABLED FOR SECURITY
router.post('/signup', async (req, res) => {
  // Signup is disabled for security - only one admin account is allowed
  res.status(403).json({ 
    error: true, 
    message: 'Admin signup is disabled. Contact system administrator for access.' 
  });
});

// POST /api/auth/forgot-password using Supabase Auth
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: true, message: 'Email is required' });
    }

    if (USE_MOCK) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent (mock).' });
    }
    const redirectTo = process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3000/admin';
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return res.status(400).json({ error: true, message: error.message });
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    } catch (e) {
      if (String(e?.message || '').includes('fetch failed')) {
        try {
          const url = `${SUPABASE_URL}/auth/v1/recover`;
          const resp = await axios.post(url, { email, redirect_to: redirectTo }, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } });
          if (resp.status >= 200 && resp.status < 300) return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
          return res.status(400).json({ error: true, message: 'Reset request failed' });
        } catch (restErr) {
          console.error('Forgot password REST fallback error:', restErr?.response?.data || restErr?.message);
          return res.status(400).json({ error: true, message: 'Failed to request password reset' });
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: true, message: 'Failed to request password reset' });
  }
});

module.exports = router;
