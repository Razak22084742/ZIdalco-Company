const express = require('express');
const router = express.Router();
const { supabaseRequest } = require('../utils/supabase');
const { sendEmail, sendAdminNotification } = require('../utils/notifications');

// Submit contact email
router.post('/send', async (req, res) => {
  try {
    const { name, email, phone, message, recipient_email } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message || !recipient_email) {
      return res.status(400).json({
        error: true,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !emailRegex.test(recipient_email)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid email format'
      });
    }

    // Prepare email data
    const emailData = {
      sender_name: name.trim(),
      sender_email: email.trim().toLowerCase(),
      sender_phone: phone.trim(),
      message: message.trim(),
      recipient_email: recipient_email.trim().toLowerCase(),
      status: 'sent',
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Store email in database first
    const result = await supabaseRequest('emails', 'POST', emailData);

    if (result.status >= 200 && result.status < 300) {
      // Try to send actual email (but don't fail the request if this fails)
      let emailSent = false;
      let notificationRecorded = false;
      
      try {
        const emailResult = await sendEmail(emailData);
        emailSent = emailResult.success;
        
        const notificationResult = await sendAdminNotification('email', emailData);
        notificationRecorded = notificationResult.success;
        
        // Update status to sent if email was sent successfully
        if (emailSent) {
          await supabaseRequest(`emails?id=eq.${result.data[0].id}`, 'PATCH', { status: 'sent' });
        }
      } catch (emailError) {
        console.warn('Email sending failed, but record saved:', emailError.message);
        // Keep status as 'sent' since the record was saved successfully
        // The frontend EmailJS will handle the actual email delivery
      }

      let message = 'Email recorded successfully!';
      if (!emailSent) {
        message += ' (Email sending failed, but admin will see it)';
      }
      if (!notificationRecorded) {
        message += ' (Admin notification failed, but admin may not see it)';
      }

      res.json({
        success: true,
        message: message,
        data: emailData
      });
    } else {
      throw new Error(`Failed to save email record: ${JSON.stringify(result.data)}`);
    }

  } catch (error) {
    console.error('Email submission error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to send email'
    });
  }
});

// Get emails (admin only)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, select } = req.query;
    
    // Handle count queries
    if (select === 'count') {
      let query = `emails?select=count`;
      if (status) {
        // Don't add eq. prefix if it's already there (e.g., neq.deleted)
        if (status.startsWith('eq.') || status.startsWith('neq.')) {
          query += `&status=${status}`;
        } else {
          query += `&status=eq.${status}`;
        }
      }
      
      const result = await supabaseRequest(query, 'GET');
      
      if (result.status === 200) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        throw new Error('Failed to fetch email count');
      }
      return;
    }
    
    // Handle regular queries
    let query = `emails?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (status) {
      // Don't add eq. prefix if it's already there (e.g., neq.deleted)
      if (status.startsWith('eq.') || status.startsWith('neq.')) {
        query += `&status=${status}`;
      } else {
        query += `&status=eq.${status}`;
      }
    }

    const result = await supabaseRequest(query, 'GET');

    if (result.status === 200) {
      res.json({
        success: true,
        emails: result.data,
        count: result.data.length
      });
    } else {
      throw new Error('Failed to fetch emails');
    }

  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to fetch emails'
    });
  }
});

// Get email by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await supabaseRequest(`emails?id=eq.${id}`, 'GET');

    if (result.status === 200 && result.data.length > 0) {
      res.json({
        success: true,
        email: result.data[0]
      });
    } else {
      res.status(404).json({
        error: true,
        message: 'Email not found'
      });
    }

  } catch (error) {
    console.error('Get email by ID error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to fetch email'
    });
  }
});

// DELETE /api/emails/:id (admin via admin router, but allow here too if needed)
// NOTE: Deletion of emails is handled in protected admin routes

// Update email status
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

    const result = await supabaseRequest(`emails?id=eq.${id}`, 'PATCH', { status });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } else {
      throw new Error('Failed to update status');
    }

  } catch (error) {
    console.error('Update email status error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to update status'
    });
  }
});

// Mark email as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await supabaseRequest(`emails?id=eq.${id}`, 'PATCH', { is_read: true });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Marked as read'
      });
    } else {
      throw new Error('Failed to mark as read');
    }

  } catch (error) {
    console.error('Mark email as read error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to mark as read'
    });
  }
});

// Reply to email
router.post('/reply', async (req, res) => {
  try {
    const { email_id, reply_message, admin_name } = req.body;

    if (!email_id || !reply_message) {
      return res.status(400).json({
        error: true,
        message: 'Email ID and reply message are required'
      });
    }

    // Prepare reply data
    const replyData = {
      email_id: email_id.toString(),
      admin_id: req.user?.id || null,
      admin_name: admin_name || 'Admin',
      reply_message,
      created_at: new Date().toISOString()
    };

    // Save reply to database
    const save = await supabaseRequest('email_replies', 'POST', replyData);

    if (save.status >= 200 && save.status < 300) {
      res.json({
        success: true,
        message: 'Reply saved successfully',
        reply: save.data[0]
      });
    } else {
      throw new Error('Failed to save reply');
    }

  } catch (error) {
    console.error('Email reply error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to save reply'
    });
  }
});

// Update email status (for admin use)
router.patch('/status', async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        error: true,
        message: 'Email ID and status are required'
      });
    }

    const result = await supabaseRequest(`emails?id=eq.${id}`, 'PATCH', { status: status });

    if (result.status >= 200 && result.status < 300) {
      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } else {
      throw new Error('Failed to update status');
    }

  } catch (error) {
    console.error('Update email status error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to update status'
    });
  }
});

// Resend email
router.post('/:id/resend', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get email details
    const emailResult = await supabaseRequest(`emails?id=eq.${id}`, 'GET');
    
    if (emailResult.status !== 200 || emailResult.data.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Email not found'
      });
    }

    const emailData = emailResult.data[0];

    // Try to resend email
    await sendEmail(emailData);
    
    // Update status to sent
    await supabaseRequest(`emails?id=eq.${id}`, 'PATCH', { 
      status: 'sent',
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Email resent successfully'
    });

  } catch (error) {
    console.error('Resend email error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to resend email'
    });
  }
});

module.exports = router;
