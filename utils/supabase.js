const axios = require('axios');
const mockDb = require('./mockDatabase');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_KEY;
const USE_MOCK = String(process.env.SUPABASE_MOCK).toLowerCase() === 'true' || !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.warn('Supabase env vars are not set. Running in MOCK mode. Set SUPABASE_URL and SUPABASE_KEY to enable real DB.');
}

function getHeaders() {
	return {
		'apikey': SUPABASE_SERVICE_KEY,
		'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
		'Content-Type': 'application/json',
		'Prefer': 'return=representation'
	};
}

function mockSelectCountResponse() {
	return { status: 200, data: [{ count: 0 }] };
}

function mockOk() {
	return { status: 200, data: [] };
}

function mockCreated(data) {
	return { status: 201, data: [{ id: Date.now(), ...data }] };
}

// Mock Supabase request function for fallback
async function mockSupabaseRequest(endpoint, method = 'GET', data = null) {
	const lowerEndpoint = String(endpoint).toLowerCase();
	console.log('Mock Supabase request (fallback):', method, endpoint);
	
	// Handle feedback operations
	if (lowerEndpoint.startsWith('feedback') && !lowerEndpoint.startsWith('feedback_replies')) {
		if (method === 'GET') {
			const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
			const params = new URLSearchParams(queryString);
			const limit = parseInt(params.get('limit')) || 50;
			const offset = parseInt(params.get('offset')) || 0;
			let status = params.get('status');
			const id = params.get('id');
			
			// Don't parse status here - let the mock function handle it
			// The mock function will handle eq. and neq. prefixes
			
			if (id) {
				const actualId = id.startsWith('eq.') ? id.substring(3) : id;
				const allFeedback = mockDb.getFeedback(100, 0);
				const feedback = allFeedback.find(f => f.id == actualId);
				return { status: 200, data: feedback ? [feedback] : [] };
			} else if (lowerEndpoint.includes('select=count')) {
				const count = mockDb.getFeedbackCount(status);
				return { status: 200, data: [{ count }] };
			} else {
				const feedback = mockDb.getFeedback(limit, offset, status);
				return { status: 200, data: feedback };
			}
		} else if (method === 'POST') {
			const newFeedback = mockDb.addFeedback(data);
			return { status: 201, data: [newFeedback] };
		} else if (method === 'PATCH') {
			const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
			if (idMatch) {
				const id = idMatch[1];
				const updated = mockDb.updateFeedback(id, data);
				return updated ? { status: 200, data: [updated] } : { status: 404, data: [] };
			}
			return { status: 400, data: [] };
		}
	}
	
	// Handle email operations
	if (lowerEndpoint.startsWith('emails')) {
		if (method === 'GET') {
			const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
			const params = new URLSearchParams(queryString);
			const limit = parseInt(params.get('limit')) || 50;
			const offset = parseInt(params.get('offset')) || 0;
			let status = params.get('status');
			const id = params.get('id');
			
			// Don't parse status here - let the mock function handle it
			// The mock function will handle eq. and neq. prefixes
			
			if (id) {
				const actualId = id.startsWith('eq.') ? id.substring(3) : id;
				const email = mockDb.getEmails(1, 0).find(e => e.id == actualId);
				return { status: 200, data: email ? [email] : [] };
			} else if (lowerEndpoint.includes('select=count')) {
				const count = mockDb.getEmailCount(status);
				return { status: 200, data: [{ count }] };
			} else {
				const emails = mockDb.getEmails(limit, offset, status);
				return { status: 200, data: emails };
			}
		} else if (method === 'POST') {
			const newEmail = mockDb.addEmail(data);
			return { status: 201, data: [newEmail] };
		} else if (method === 'PATCH') {
			const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
			if (idMatch) {
				const id = idMatch[1];
				const updated = mockDb.updateEmail(id, data);
				return updated ? { status: 200, data: [updated] } : { status: 404, data: [] };
			}
			return { status: 400, data: [] };
		}
	}
	
	// Default mock response
	return { status: 200, data: [] };
}

async function supabaseRequest(endpoint, method = 'GET', data = null) {
	// Force mock mode if we detect connection issues
	if (USE_MOCK) {
		const lowerEndpoint = String(endpoint).toLowerCase();
		console.log('Supabase request:', method, endpoint, 'lowerEndpoint:', lowerEndpoint);
		
		// Handle feedback operations (but not feedback_replies)
		if (lowerEndpoint.startsWith('feedback') && !lowerEndpoint.startsWith('feedback_replies')) {
			console.log('Processing feedback request (not replies):', method, endpoint);
			if (method === 'GET') {
				// Parse query parameters
				const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
				const params = new URLSearchParams(queryString);
				const limit = parseInt(params.get('limit')) || 50;
				const offset = parseInt(params.get('offset')) || 0;
				let status = params.get('status');
				const id = params.get('id');
				
				console.log('Raw status from URL:', status);
				console.log('Status type:', typeof status);
				
				// Don't parse status here - let the mock function handle it
				// The mock function will handle eq. and neq. prefixes
				
				if (id) {
					// Get specific feedback by ID
					const allFeedback = mockDb.getFeedback(100, 0); // Get more feedback to search through
					console.log('All feedback in DB:', allFeedback);
					console.log('Looking for feedback with ID:', id, 'Type:', typeof id);
					
					// Extract the actual ID from the "eq.ID" format
					const actualId = id.startsWith('eq.') ? id.substring(3) : id;
					console.log('Extracted actual ID:', actualId);
					
					const feedback = allFeedback.find(f => f.id == actualId);
					console.log('Found feedback:', feedback);
					return { status: 200, data: feedback ? [feedback] : [] };
				} else if (lowerEndpoint.includes('select=count')) {
					// Get count
					const count = mockDb.getFeedbackCount(status);
					return { status: 200, data: [{ count }] };
				} else {
					// Get all feedback
					console.log('Getting feedback from mock DB, limit:', limit, 'offset:', offset, 'status:', status);
					console.log('Status type:', typeof status, 'Status value:', JSON.stringify(status));
					const feedback = mockDb.getFeedback(limit, offset, status);
					console.log('Retrieved feedback:', feedback);
					return { status: 200, data: feedback };
				}
			} else if (method === 'POST') {
				console.log('Adding feedback to mock DB:', data);
				const newFeedback = mockDb.addFeedback(data);
				console.log('Added feedback:', newFeedback);
				return { status: 201, data: [newFeedback] };
			} else if (method === 'PATCH') {
				// Handle bulk updates (e.g., is_read=eq.false)
				if (endpoint.includes('is_read=eq.false')) {
					console.log('Bulk update: marking all unread items as read');
					const updatedCount = mockDb.markAllFeedbackAsRead();
					console.log('Marked', updatedCount, 'feedback items as read');
					return { status: 200, data: [] };
				}
				
				// Extract ID from endpoint - handle decimal numbers
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const updated = mockDb.updateFeedback(id, data);
					return updated ? { status: 200, data: [updated] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			} else if (method === 'DELETE') {
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const deleted = mockDb.deleteFeedback(id);
					return deleted ? { status: 200, data: [] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			}
		}
		
		// Handle email operations
		if (lowerEndpoint.startsWith('emails')) {
			if (method === 'GET') {
				const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
				const params = new URLSearchParams(queryString);
				const limit = parseInt(params.get('limit')) || 50;
				const offset = parseInt(params.get('offset')) || 0;
				let status = params.get('status');
				const id = params.get('id');
				
				// Handle eq. and neq. prefixes for status (e.g., status=eq.sent, status=neq.deleted)
				if (status && status.startsWith('eq.')) {
					status = status.substring(3);
				} else if (status && status.startsWith('neq.')) {
					status = status.substring(4);
				}
				
				if (id) {
					const actualId = id.startsWith('eq.') ? id.substring(3) : id;
					const email = mockDb.getEmails(1, 0).find(e => e.id == actualId);
					return { status: 200, data: email ? [email] : [] };
				} else if (lowerEndpoint.includes('select=count')) {
					console.log('Getting email count with status:', status);
					const count = mockDb.getEmailCount(status);
					console.log('Email count result:', count);
					return { status: 200, data: [{ count }] };
				} else {
					const emails = mockDb.getEmails(limit, offset, status);
					return { status: 200, data: emails };
				}
			} else if (method === 'POST') {
				const newEmail = mockDb.addEmail(data);
				return { status: 201, data: [newEmail] };
			} else if (method === 'PATCH') {
				// Handle bulk updates (e.g., is_read=eq.false)
				if (endpoint.includes('is_read=eq.false')) {
					console.log('Bulk update: marking all unread emails as read');
					const updatedCount = mockDb.markAllEmailsAsRead();
					console.log('Marked', updatedCount, 'email items as read');
					return { status: 200, data: [] };
				}
				
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const updated = mockDb.updateEmail(id, data);
					return updated ? { status: 200, data: [updated] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			} else if (method === 'DELETE') {
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const deleted = mockDb.deleteEmail(id);
					return deleted ? { status: 200, data: [] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			}
		}
		
		// Handle content operations
		if (lowerEndpoint.startsWith('contents')) {
			if (method === 'GET') {
				const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
				const params = new URLSearchParams(queryString);
				const limit = parseInt(params.get('limit')) || 100;
				const offset = parseInt(params.get('offset')) || 0;
				let location = params.get('location');
				let slot = params.get('slot');
				const id = params.get('id');
				
				// Strip eq. prefix from location and slot parameters
				if (location && location.startsWith('eq.')) {
					location = location.substring(3);
				}
				if (slot && slot.startsWith('eq.')) {
					slot = slot.substring(3);
				}
				
				if (id) {
					const actualId = id.startsWith('eq.') ? id.substring(3) : id;
					const content = mockDb.getContent(1, 0).find(c => c.id == actualId);
					return { status: 200, data: content ? [content] : [] };
				} else {
					const content = mockDb.getContent(limit, offset, location, slot);
					return { status: 200, data: content };
				}
			} else if (method === 'POST') {
				const newContent = mockDb.addContent(data);
				return { status: 201, data: [newContent] };
			} else if (method === 'PATCH') {
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const updated = mockDb.updateContent(id, data);
					return updated ? { status: 200, data: [updated] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			} else if (method === 'DELETE') {
				const idMatch = endpoint.match(/id=eq\.([\d.]+)/);
				if (idMatch) {
					const id = idMatch[1];
					const deleted = mockDb.deleteContent(id);
					return deleted ? { status: 200, data: [] } : { status: 404, data: [] };
				}
				return { status: 400, data: [] };
			}
		}
		
		// Handle feedback replies
		if (lowerEndpoint.startsWith('feedback_replies')) {
			console.log('Processing feedback_replies request:', method, data);
			if (method === 'POST') {
				const newReply = mockDb.addFeedbackReply(data);
				console.log('Added reply to feedbackReplies:', newReply);
				return { status: 201, data: [newReply] };
			} else if (method === 'GET') {
				const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
				const params = new URLSearchParams(queryString);
				const feedbackId = params.get('feedback_id');
				if (feedbackId) {
					// Extract the actual ID from the "eq.ID" format
					const actualId = feedbackId.startsWith('eq.') ? feedbackId.substring(3) : feedbackId;
					console.log('Getting feedback replies for ID:', actualId);
					const replies = mockDb.getFeedbackReplies(actualId);
					console.log('Found replies:', replies);
					return { status: 200, data: replies };
				}
				return { status: 200, data: [] };
			}
		}
		
		// Handle email replies
		if (lowerEndpoint.startsWith('email_replies')) {
			if (method === 'POST') {
				const newReply = mockDb.addEmailReply(data);
				return { status: 201, data: [newReply] };
			} else if (method === 'GET') {
				const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
				const params = new URLSearchParams(queryString);
				const emailId = params.get('email_id');
				if (emailId) {
					const replies = mockDb.getEmailReplies(emailId);
					return { status: 200, data: replies };
				}
				return { status: 200, data: [] };
			}
		}
		
		// Default mock
		return { status: 200, data: [] };
	}

	const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
	try {
		const response = await axios({
			url,
			method,
			data,
			headers: getHeaders(),
			validateStatus: () => true,
			timeout: 5000 // 5 second timeout
		});
		return { status: response.status, data: response.data };
	} catch (error) {
		console.error('Supabase connection error:', error.message);
		// If it's a connection error, fall back to mock mode
		if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
			console.log('Falling back to mock mode due to connection error');
			// Force mock mode for this request
			return await mockSupabaseRequest(endpoint, method, data);
		}
		return { status: 500, data: { error: error.message } };
	}
}

module.exports = { supabaseRequest };
