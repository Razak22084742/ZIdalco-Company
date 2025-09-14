const express = require('express');
const router = express.Router();
const { supabaseRequest } = require('../utils/supabase');
const { sendAdminNotification, sendReplyNotification } = require('../utils/notifications');

// Submit customer feedback
router.post('/submit', async (req, res) => {
  try {
    const { name, message } = req.body;
    const email = (req.body.email || req.body.sender_email || '').toString();
    const phone = (req.body.phone || req.body.sender_phone || '').toString();
    const type = (req.body.type || 'general').toString();

    // Validate required fields
    if (!name || !message) {
      return res.status(400).json({
        error: true,
        message: 'Name and message are required'
      });
    }

    // Prepare feedback data
    const feedbackData = {
      name: String(name).trim(),
      email: email ? email.trim().toLowerCase() : 'unknown@local',
      phone: phone ? phone.trim() : '',
      message: String(message).trim(),
      type: type.trim(),
      status: 'new',
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Insert into Supabase
    const result = await supabaseRequest('feedback', 'POST', feedbackData);

    if (result.status >= 200 && result.status < 300) {
      // Send admin notification
      const notificationResult = await sendAdminNotification('feedback', feedbackData);
      
      let message = 'Feedback submitted successfully!';
      if (!notificationResult.success) {
        message += ' (Admin notification failed, but admin may not see it)';
      }

      res.json({
        success: true,
        message: message,
        data: feedbackData
      });
    } else {
      throw new Error(`Failed to save feedback: ${JSON.stringify(result.data)}`);
    }

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to submit feedback'
    });
  }
});

// Get feedback (public)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = `feedback?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    // exclude deleted by default
    query += `&status=neq.deleted`;
    
    if (status) {
      query += `&status=eq.${status}`;
    }

    const result = await supabaseRequest(query, 'GET');

    if (result.status === 200) {
      res.json({
        success: true,
        feedback: result.data,
        count: result.data.length
      });
    } else {
      throw new Error('Failed to fetch feedback');
    }

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to fetch feedback'
    });
  }
});

// Get feedback by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await supabaseRequest(`feedback?id=eq.${id}`, 'GET');

    if (result.status === 200 && result.data.length > 0) {
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
      res.status(404).json({
        error: true,
        message: 'Feedback not found'
      });
    }

  } catch (error) {
    console.error('Get feedback by ID error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to fetch feedback'
    });
  }
});

// Update feedback status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: true,
        message: 'Status is required'
      });
    }

    const result = await supabaseRequest(`feedback?id=eq.${id}`, 'PATCH', { status });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } else {
      throw new Error('Failed to update status');
    }

  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to update status'
    });
  }
});

// Mark feedback as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await supabaseRequest(`feedback?id=eq.${id}`, 'PATCH', { is_read: true });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Marked as read'
      });
    } else {
      throw new Error('Failed to mark as read');
    }

  } catch (error) {
    console.error('Mark feedback as read error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to mark as read'
    });
  }
});

// Save admin reply to feedback
router.post('/reply', async (req, res) => {
  try {
    const { feedback_id, reply_message, admin_name } = req.body;

    if (!feedback_id || !reply_message) {
      return res.status(400).json({
        error: true,
        message: 'Feedback ID and reply message are required'
      });
    }

    // Save reply to feedback_replies collection
    const replyData = {
      feedback_id: feedback_id,
      reply_message: reply_message,
      admin_name: admin_name || 'Admin',
      created_at: new Date().toISOString()
    };

    const result = await supabaseRequest('feedback_replies', 'POST', replyData);

    if (result.status >= 200 && result.status < 300) {
      // Get original feedback details for email notification
      const feedbackResult = await supabaseRequest(`feedback?id=eq.${feedback_id}`, 'GET');
      if (feedbackResult.status === 200 && feedbackResult.data.length > 0) {
        const feedback = feedbackResult.data[0];
        
        // Send email notification to the original feedback sender
        await sendReplyNotification({
          feedback_name: feedback.name,
          feedback_email: feedback.email,
          feedback_message: feedback.message,
          reply_message: reply_message,
          admin_name: admin_name || 'Admin'
        });
      }
      
      res.json({
        success: true,
        message: 'Reply saved successfully',
        data: result.data
      });
    } else {
      throw new Error('Failed to save reply');
    }

  } catch (error) {
    console.error('Save reply error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to save reply'
    });
  }
});

// Update feedback status
router.patch('/status', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        error: true,
        message: 'Feedback ID and status are required'
      });
    }

    const result = await supabaseRequest(`feedback?id=eq.${id}`, 'PATCH', { status: status });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } else {
      throw new Error('Failed to update status');
    }

  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to update status'
    });
  }
});

module.exports = router;
