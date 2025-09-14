const nodemailer = require('nodemailer');
require('dotenv').config();

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP env vars not fully set. Emails will be logged instead of sent.');
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function sendEmail(emailData) {
  const transporter = getTransport();
  const { sender_name, sender_email, sender_phone, message, recipient_email } = emailData;

  const mailOptions = {
    from: sender_email,
    to: recipient_email,
    subject: `New Message from Zidalco Website - ${sender_name}`,
    html: `
      <h2>New Message from Zidalco Website</h2>
      <p><strong>Name:</strong> ${sender_name}</p>
      <p><strong>Email:</strong> ${sender_email}</p>
      <p><strong>Phone:</strong> ${sender_phone}</p>
      <p><strong>Message:</strong></p>
      <p>${(message || '').replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Sent from the Zidalco contact form.</em></p>
    `
  };

  if (!transporter) {
    console.log('Email (not sent, missing SMTP config):', mailOptions);
    return { queued: true, success: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', recipient_email);
    return { queued: false, success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { queued: false, success: false, error: error.message };
  }
}

async function sendAdminNotification(type, payload) {
  // Record admin notification in the database for admin dashboard
  try {
    const { supabaseRequest } = require('./supabase');
    
    // For now, we'll just log the notification since the admin dashboard
    // already shows feedback and emails directly from their respective tables
    console.log('Admin notification:', { type, payload });
    
    // In a real implementation, you might want to:
    // 1. Create an admin_notifications table
    // 2. Store notifications there
    // 3. Show them in the admin dashboard
    
    // For now, return success since the admin can see feedback/emails
    // directly from the feedback and emails tables
    return { success: true, logged: true };
    
  } catch (error) {
    console.error('Failed to record admin notification:', error);
    console.log('Admin notification (fallback logging):', { type, payload });
    return { success: false, fallback: true, error: error.message };
  }
}

async function sendReplyNotification(replyData) {
  const transporter = getTransport();
  const { feedback_name, feedback_email, feedback_message, reply_message, admin_name } = replyData;

  const mailOptions = {
    from: process.env.SMTP_USER || 'noreply@zidalco.com',
    to: feedback_email,
    subject: `Reply to your feedback - Zidalco Company Limited`,
    html: `
      <h2>Reply to Your Feedback</h2>
      <p>Dear ${feedback_name},</p>
      <p>Thank you for your feedback. We have reviewed your message and here is our response:</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #006400;">
        <h3>Your Original Message:</h3>
        <p>${feedback_message}</p>
      </div>
      
      <div style="background: #e8f5e8; padding: 15px; margin: 15px 0; border-left: 4px solid #006400;">
        <h3>Our Reply:</h3>
        <p>${reply_message}</p>
        <p><em>- ${admin_name}, Zidalco Team</em></p>
      </div>
      
      <p>If you have any further questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Zidalco Company Limited</p>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log('Reply notification sent to:', feedback_email);
      return true;
    } catch (error) {
      console.error('Failed to send reply notification:', error);
      return false;
    }
  } else {
    console.log('Reply notification (SMTP not configured):', mailOptions);
    return true; // Return true for demo purposes
  }
}

module.exports = { sendEmail, sendAdminNotification, sendReplyNotification };
