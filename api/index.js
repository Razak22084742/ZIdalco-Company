// Vercel serverless function entry point - Full API
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import all the route modules
const feedbackRoutes = require('../routes/feedback');
const emailRoutes = require('../routes/emails');
const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const { supabaseRequest } = require('../utils/supabase');

// API Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// Public read for site contents
app.get('/api/contents', async (req, res) => {
  try {
    const { location, slot, limit = 20, offset = 0 } = req.query;
    let query = `contents?is_deleted=eq.false&is_published=eq.true&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (location) query += `&location=eq.${location}`;
    if (slot) query += `&slot=eq.${slot}`;
    const result = await supabaseRequest(query, 'GET');
    if (result.status === 200) return res.json({ success: true, contents: result.data });
    return res.status(500).json({ error: true, message: 'Failed to fetch contents' });
  } catch (e) {
    res.status(500).json({ error: true, message: 'Failed to fetch contents' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files for Vercel
app.use(express.static(path.join(__dirname, '..')));

// Handle CSS files
app.get('*.css', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('/* CSS file not found */');
  });
});

// Handle JS files
app.get('*.js', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('// JS file not found');
  });
});

// Handle images
app.get('*.png', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Image not found');
  });
});

app.get('*.jpg', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Image not found');
  });
});

app.get('*.jpeg', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Image not found');
  });
});

// Handle HTML files
app.get('*.html', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('HTML file not found');
  });
});

// Catch-all handler - serve index.html for SPA routing
app.get('*', (req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const indexPath = path.join(__dirname, '..', 'index.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Page not found');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// Export for Vercel
module.exports = app;