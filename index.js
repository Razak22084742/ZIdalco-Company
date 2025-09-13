const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Favicon and missing favicon.png fallback
app.get(['/favicon.ico', '/Images/favicon.png'], (req, res) => {
  const logoPath = path.join(__dirname, 'Images', 'logo.jpg');
  res.type('image/jpeg');
  res.sendFile(logoPath, (err) => {
    if (err) res.status(204).end();
  });
});

// Serve static files
app.use(express.static(path.join(__dirname)));
// Serve uploaded files statically (OS temp dir for serverless)
app.use('/uploads', express.static(path.join(os.tmpdir(), 'zidalco-uploads')));

// Routes
const feedbackRoutes = require('./routes/feedback');
const emailRoutes = require('./routes/emails');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const { supabaseRequest } = require('./utils/supabase');

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

// Public route to get feedback with replies (for homepage)
app.get('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseRequest(`feedback?id=eq.${id}`, 'GET');
    if (result.status === 200 && Array.isArray(result.data) && result.data.length > 0) {
      const feedback = result.data[0];
      
      // Get replies for this feedback
      const repliesResult = await supabaseRequest(`feedback_replies?feedback_id=eq.${id}`, 'GET');
      const replies = repliesResult.status === 200 ? repliesResult.data : [];
      
      res.json({ 
        success: true, 
        feedback: {
          ...feedback,
          replies: replies
        }
      });
    } else {
      res.status(404).json({ error: true, message: 'Feedback not found' });
    }
  } catch (error) {
    console.error('Get feedback by ID error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch feedback' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', ts: new Date().toISOString() });
});

// Fallbacks for top-level pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: true, message: 'Internal server error' });
});

// Export the app for Vercel serverless
module.exports = app;

// Start server only when run directly (local dev)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
