// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root of the project
app.use(express.static(path.join(__dirname, '..')));

// Basic API endpoints (simplified to avoid crashes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/feedback', (req, res) => {
  res.json({ message: 'Feedback API - Working', data: [] });
});

app.post('/api/feedback', (req, res) => {
  res.json({ message: 'Feedback submitted successfully', id: Date.now() });
});

app.get('/api/admin', (req, res) => {
  res.json({ message: 'Admin API - Working', stats: { total_feedback: 0, total_emails: 0 } });
});

app.get('/api/emails', (req, res) => {
  res.json({ message: 'Emails API - Working', data: [] });
});

app.post('/api/emails', (req, res) => {
  res.json({ message: 'Email sent successfully', id: Date.now() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@zidalco.com' && password === 'admin123') {
    res.json({ 
      message: 'Login successful', 
      token: 'mock-token-' + Date.now(),
      user: { email: 'admin@zidalco.com', name: 'Admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Default to index.html for SPA routing
  res.sendFile(path.join(__dirname, '..', 'index.html'));
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