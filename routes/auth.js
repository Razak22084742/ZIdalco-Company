const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabaseClient');
const { authenticateUser, createUser } = require('../utils/userDatabase');
const axios = require('axios');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const USE_MOCK = String(process.env.SUPABASE_MOCK).toLowerCase() === 'true' || !SUPABASE_URL;

// POST /api/auth/login using proper authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required' });
    }

    if (USE_MOCK) {
      // Use local user database for authentication
      const authResult = await authenticateUser(email, password);
      if (!authResult.success) {
        return res.status(401).json({ error: true, message: authResult.message });
      }
      
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
      if (error) return res.status(401).json({ error: true, message: error.message });
      return res.json({ success: true, message: 'Login successful', token: data.session.access_token, admin: { id: data.user?.id, name: data.user?.user_metadata?.name, email } });
    } catch (e) {
      // Fallback to REST if fetch failed
      if (String(e?.message || '').includes('fetch failed')) {
        try {
          const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
          const resp = await axios.post(url, { email, password }, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } });
          if (resp.status >= 200 && resp.status < 300) {
            const d = resp.data;
            return res.json({ success: true, message: 'Login successful', token: d.access_token, admin: { id: d.user?.id, name: d.user?.user_metadata?.name, email } });
          }
          return res.status(401).json({ error: true, message: 'Invalid credentials' });
        } catch (restErr) {
          console.error('Login REST fallback error:', restErr?.response?.data || restErr?.message);
          return res.status(400).json({ error: true, message: 'Login failed' });
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: 'Login failed' });
  }
});

// POST /api/auth/signup - BLOCKED FOR SECURITY
router.post('/signup', async (req, res) => {
  // Signup is completely blocked for security reasons
  // Only one admin account is allowed
  return res.status(403).json({ 
    error: true, 
    message: 'Admin signup is disabled for security reasons. Only authorized personnel can access the admin portal.' 
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

// POST /api/auth/change-password - SECURE PASSWORD CHANGE
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: true, message: 'All fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: true, message: 'New passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: true, message: 'New password must be at least 6 characters long' });
    }
    
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: true, message: 'New password must be different from current password' });
    }

    if (USE_MOCK) {
      // For mock mode, we need to verify the current password and update it
      const { verifyPassword, hashPassword, findUserByEmail } = require('../utils/userDatabase');
      
      // Get the admin user (only one admin account allowed)
      const adminUser = findUserByEmail('admin@zidalco.com');
      if (!adminUser) {
        return res.status(404).json({ error: true, message: 'Admin account not found' });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, adminUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: true, message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password in the user database
      adminUser.password = hashedNewPassword;
      
      return res.json({ 
        success: true, 
        message: 'Password changed successfully. Please log in again with your new password.' 
      });
    }
    
    // For production with Supabase, this would require proper authentication
    return res.status(501).json({ error: true, message: 'Password change not implemented for production mode' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: true, message: 'Failed to change password' });
  }
});

module.exports = router;
