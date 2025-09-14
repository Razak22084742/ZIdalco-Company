// In-memory database for mock mode with file persistence
// This will persist data between server restarts

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'mock-db.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load data from file or initialize empty arrays
let data = { feedbackData: [], emailData: [], contentData: [], feedbackReplies: [], emailReplies: [] };

if (fs.existsSync(DATA_FILE)) {
  try {
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(fileData);
  } catch (error) {
    console.log('Error loading mock database, starting fresh:', error.message);
  }
}

let { feedbackData, emailData, contentData, feedbackReplies, emailReplies } = data;

// Save data to file
function saveData() {
  try {
    const dataToSave = {
      feedbackData,
      emailData,
      contentData,
      feedbackReplies,
      emailReplies
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.error('Error saving mock database:', error.message);
  }
}

// Feedback operations
function addFeedback(feedback) {
  const newFeedback = {
    id: Date.now() + Math.random(),
    ...feedback,
    created_at: new Date().toISOString()
  };
  feedbackData.unshift(newFeedback);
  saveData();
  return newFeedback;
}

function getFeedback(limit = 50, offset = 0, status = null) {
  let filtered = feedbackData;
  
  console.log('getFeedback called with:', { limit, offset, status });
  console.log('Original feedbackData:', feedbackData);
  
  if (status) {
    if (status === 'neq.deleted') {
      // Exclude deleted items
      filtered = feedbackData.filter(item => item.status !== 'deleted');
    } else if (status.startsWith('neq.')) {
      // Handle other neq. prefixes
      const excludeStatus = status.substring(4);
      filtered = feedbackData.filter(item => item.status !== excludeStatus);
    } else {
      filtered = feedbackData.filter(item => item.status === status);
    }
    console.log('After status filter:', filtered);
  } else {
    // Exclude deleted by default
    filtered = feedbackData.filter(item => item.status !== 'deleted');
  }
  
  // Only return actual feedback items, not replies
  // Filter out items that have feedback_id (replies) or reply_message (replies)
  // But only if those fields actually exist and have values
  filtered = filtered.filter(item => {
    // Keep items that don't have feedback_id or reply_message fields
    // OR items where those fields are null/undefined/empty
    return !item.feedback_id && !item.reply_message;
  });
  
  console.log('Final filtered result:', filtered);
  
  return filtered.slice(offset, offset + limit);
}

function getFeedbackCount(status = null) {
  let filtered = feedbackData;
  
  if (status) {
    if (status === 'neq.deleted') {
      filtered = feedbackData.filter(item => item.status !== 'deleted');
    } else {
      filtered = feedbackData.filter(item => item.status === status);
    }
  } else {
    filtered = feedbackData.filter(item => item.status !== 'deleted');
  }
  
  // Only count actual feedback items, not replies
  // Filter out items that have feedback_id (replies) or reply_message (replies)
  filtered = filtered.filter(item => !item.feedback_id && !item.reply_message);
  
  return filtered.length;
}

function updateFeedback(id, updates) {
  const index = feedbackData.findIndex(item => item.id == id);
  if (index !== -1) {
    feedbackData[index] = { ...feedbackData[index], ...updates };
    saveData();
    return feedbackData[index];
  }
  return null;
}

function markAllFeedbackAsRead() {
  let updatedCount = 0;
  feedbackData.forEach(item => {
    if (!item.is_read) {
      item.is_read = true;
      updatedCount++;
    }
  });
  if (updatedCount > 0) {
    saveData();
  }
  return updatedCount;
}

function deleteFeedback(id) {
  const index = feedbackData.findIndex(item => item.id == id);
  if (index !== -1) {
    feedbackData.splice(index, 1);
    saveData();
    return true;
  }
  return false;
}

// Email operations
function addEmail(email) {
  const newEmail = {
    id: Date.now() + Math.random(),
    ...email,
    created_at: new Date().toISOString()
  };
  emailData.unshift(newEmail);
  saveData();
  return newEmail;
}

function getEmails(limit = 50, offset = 0, status = null) {
  let filtered = emailData;
  
  if (status) {
    if (status === 'deleted') {
      // This means the original query was status=neq.deleted, so we want non-deleted items
      filtered = emailData.filter(item => item.status !== 'deleted');
    } else {
      filtered = emailData.filter(item => item.status === status);
    }
  } else {
    filtered = emailData.filter(item => item.status !== 'deleted');
  }
  
  return filtered.slice(offset, offset + limit);
}

function getEmailCount(status = null) {
  let filtered = emailData;
  
  if (status) {
    if (status === 'deleted') {
      // This means the original query was status=neq.deleted, so we want non-deleted items
      filtered = emailData.filter(item => item.status !== 'deleted');
    } else {
      filtered = emailData.filter(item => item.status === status);
    }
  } else {
    filtered = emailData.filter(item => item.status !== 'deleted');
  }
  
  return filtered.length;
}

function updateEmail(id, updates) {
  const index = emailData.findIndex(item => item.id == id);
  if (index !== -1) {
    emailData[index] = { ...emailData[index], ...updates };
    saveData();
    return emailData[index];
  }
  return null;
}

function markAllEmailsAsRead() {
  let updatedCount = 0;
  emailData.forEach(item => {
    if (!item.is_read) {
      item.is_read = true;
      updatedCount++;
    }
  });
  if (updatedCount > 0) {
    saveData();
  }
  return updatedCount;
}

function deleteEmail(id) {
  const index = emailData.findIndex(item => item.id == id);
  if (index !== -1) {
    emailData.splice(index, 1);
    saveData();
    return true;
  }
  return false;
}

// Content operations
function addContent(content) {
  const newContent = {
    id: Date.now() + Math.random(),
    ...content,
    created_at: new Date().toISOString()
  };
  contentData.unshift(newContent);
  saveData();
  return newContent;
}

function getContent(limit = 100, offset = 0, location = null, slot = null) {
  let filtered = contentData.filter(item => !item.is_deleted);
  
  if (location) {
    filtered = filtered.filter(item => item.location === location);
  }
  
  if (slot) {
    filtered = filtered.filter(item => item.slot === slot);
  }
  
  return filtered.slice(offset, offset + limit);
}

function updateContent(id, updates) {
  const index = contentData.findIndex(item => item.id == id);
  if (index !== -1) {
    contentData[index] = { ...contentData[index], ...updates };
    saveData();
    return contentData[index];
  }
  return null;
}

function deleteContent(id) {
  const index = contentData.findIndex(item => item.id == id);
  if (index !== -1) {
    contentData[index] = { ...contentData[index], is_deleted: true, is_published: false };
    saveData();
    return true;
  }
  return false;
}

// Feedback Reply operations
function addFeedbackReply(reply) {
  const newReply = {
    id: Date.now() + Math.random(),
    ...reply,
    created_at: new Date().toISOString()
  };
  feedbackReplies.unshift(newReply);
  saveData();
  return newReply;
}

function getFeedbackReplies(feedbackId) {
  return feedbackReplies.filter(reply => reply.feedback_id == feedbackId);
}

function getFeedbackWithReplies(feedbackId) {
  const feedback = feedbackData.find(item => item.id == feedbackId);
  if (!feedback) return null;
  
  const replies = getFeedbackReplies(feedbackId);
  return {
    ...feedback,
    replies: replies
  };
}

// Email Reply operations
function addEmailReply(reply) {
  const newReply = {
    id: Date.now() + Math.random(),
    ...reply,
    created_at: new Date().toISOString()
  };
  emailReplies.unshift(newReply);
  saveData();
  return newReply;
}

function getEmailReplies(emailId) {
  return emailReplies.filter(reply => reply.email_id == emailId);
}

function getEmailWithReplies(emailId) {
  const email = emailData.find(item => item.id == emailId);
  if (!email) return null;
  
  const replies = getEmailReplies(emailId);
  return {
    ...email,
    replies: replies
  };
}

module.exports = {
  // Feedback
  addFeedback,
  getFeedback,
  getFeedbackCount,
  updateFeedback,
  markAllFeedbackAsRead,
  deleteFeedback,
  
  // Emails
  addEmail,
  getEmails,
  getEmailCount,
  updateEmail,
  markAllEmailsAsRead,
  deleteEmail,
  
  // Content
  addContent,
  getContent,
  updateContent,
  deleteContent,
  
  // Feedback Replies
  addFeedbackReply,
  getFeedbackReplies,
  getFeedbackWithReplies,
  
  // Email Replies
  addEmailReply,
  getEmailReplies,
  getEmailWithReplies
};
