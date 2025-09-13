// Vercel serverless function entry point - API only
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoints
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

// Fixed admin login
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