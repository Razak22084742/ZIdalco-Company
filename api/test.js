// Simple test function for Vercel
module.exports = (req, res) => {
  res.json({ 
    message: 'Test function working',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
};
