// Vercel serverless function entry point - Simplified but functional
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });
  
  if (email === 'admin@zidalco.com' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'mock-token-' + Date.now(),
      admin: { email: 'admin@zidalco.com', name: 'Admin' }
    });
  } else {
    res.status(401).json({ 
      success: false,
      error: 'Invalid credentials' 
    });
  }
});

// Mock API endpoints for admin dashboard
app.get('/api/admin', (req, res) => {
  res.json({ 
    success: true,
    stats: { 
      total_feedback: 3, 
      total_emails: 0, 
      unread_feedback: 3, 
      unread_emails: 0 
    } 
  });
});

app.get('/api/admin/feedback', (req, res) => {
  res.json({ 
    success: true,
    feedback: [
      {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test feedback',
        status: 'new',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/admin/emails', (req, res) => {
  res.json({ 
    success: true,
    emails: []
  });
});

app.get('/api/admin/notifications', (req, res) => {
  res.json({ 
    success: true,
    notifications: []
  });
});

app.get('/api/admin/contents', (req, res) => {
  res.json({ 
    success: true,
    contents: []
  });
});

// Feedback endpoints
app.get('/api/feedback', (req, res) => {
  res.json({ 
    success: true,
    feedback: [
      {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test feedback',
        status: 'new',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/feedback', (req, res) => {
  res.json({ 
    success: true,
    message: 'Feedback submitted successfully',
    id: Date.now()
  });
});

// Email endpoints
app.get('/api/emails', (req, res) => {
  res.json({ 
    success: true,
    emails: []
  });
});

app.post('/api/emails', (req, res) => {
  res.json({ 
    success: true,
    message: 'Email sent successfully',
    id: Date.now()
  });
});

// Content endpoints
app.get('/api/contents', (req, res) => {
  res.json({ 
    success: true,
    contents: []
  });
});

// Serve static files
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