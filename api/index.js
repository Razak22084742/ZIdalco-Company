// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

// Handle CSS files
app.get('*.css', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  console.log('CSS request:', req.path, 'File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } else {
    console.log('CSS file not found:', filePath);
    res.status(404).send('/* CSS file not found */');
  }
});

// Handle JS files
app.get('*.js', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  console.log('JS request:', req.path, 'File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } else {
    console.log('JS file not found:', filePath);
    res.status(404).send('// JS file not found');
  }
});

// Handle images
app.get('*.png', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

app.get('*.jpg', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

app.get('*.jpeg', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Handle HTML files
app.get('*.html', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  console.log('HTML request:', req.path, 'File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(filePath);
  } else {
    res.status(404).send('HTML file not found');
  }
});

// Catch-all handler - serve index.html for SPA routing
app.get('*', (req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  console.log('Catch-all request:', req.path);
  const indexPath = path.join(__dirname, '..', 'index.html');
  console.log('Serving index.html from:', indexPath, 'Exists:', fs.existsSync(indexPath));
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(indexPath);
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