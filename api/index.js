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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic API endpoints
app.get('/api/feedback', (req, res) => {
  res.json({ message: 'Feedback API working' });
});

app.get('/api/admin', (req, res) => {
  res.json({ message: 'Admin API working' });
});

app.get('/api/emails', (req, res) => {
  res.json({ message: 'Emails API working' });
});

app.get('/api/auth', (req, res) => {
  res.json({ message: 'Auth API working' });
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

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
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Export for Vercel
module.exports = app;