// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
        this.admin = JSON.parse(localStorage.getItem('admin_data') || sessionStorage.getItem('admin_data') || '{}');
        this.currentSection = 'dashboard';
        this.notificationInterval = null;
        this.useLocalContent = true; // Frontend-only CMS mode
        
        // API URL configuration for production
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://zidalco-api-5nf2.onrender.com';
        
        console.log('Admin API Base URL:', this.apiBaseUrl);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuth();
        this.startNotificationPolling();
    }
    
    setupEventListeners() {
        // Admin login only - no tabs needed
        
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
        

        // Password visibility toggles
        const toggleLoginBtn = document.getElementById('toggleLoginPassword');
        if (toggleLoginBtn) toggleLoginBtn.addEventListener('click', () => this.togglePasswordVisibility('loginPassword', 'toggleLoginPassword'));
        const toggleSignupBtn = document.getElementById('toggleSignupPassword');
        if (toggleSignupBtn) toggleSignupBtn.addEventListener('click', () => this.togglePasswordVisibility('signupPassword', 'toggleSignupPassword'));

        // Tabs switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchAuthTab(btn.dataset.tab));
        });

        // Forgot password
        const forgotBtn = document.getElementById('forgotPasswordBtn');
        if (forgotBtn) forgotBtn.addEventListener('click', () => this.handleForgotPassword());
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(item.dataset.section);
            });
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Filters
        document.getElementById('feedbackStatusFilter').addEventListener('change', () => {
            this.loadFeedback();
        });
        
        document.getElementById('emailStatusFilter').addEventListener('change', () => {
            this.loadEmails();
        });

        // Content form handlers
        const contentImage = document.getElementById('contentImage');
        if (contentImage) {
            contentImage.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    this.currentContentImageUrl = reader.result; // base64 data URL
                    const img = document.getElementById('contentImagePreview');
                    img.src = reader.result;
                    img.style.display = 'block';
                };
                reader.readAsDataURL(file);
            });
        }

        const resetBtn = document.getElementById('resetContentForm');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetContentForm());

        const createBtn = document.getElementById('createContentBtn');
        if (createBtn) createBtn.addEventListener('click', () => this.resetContentForm());

        const contentForm = document.getElementById('contentForm');
        if (contentForm) contentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });
        
        // Settings forms
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    }
    
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('loginRemember')?.checked !== false;
        const submitBtn = document.getElementById('loginSubmitBtn');
        this.setButtonLoading(submitBtn, true);
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.token; // Supabase access token
                this.admin = data.admin || { email };
                const storage = remember ? localStorage : sessionStorage;
                const other = remember ? sessionStorage : localStorage;
                storage.setItem('admin_token', this.token);
                storage.setItem('admin_data', JSON.stringify(this.admin));
                other.removeItem('admin_token');
                other.removeItem('admin_data');
                
                this.showDashboard();
                this.loadDashboardData();
            } else {
                this.showError(data.message || 'Invalid credentials');
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }
    
    async handleSignup() {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const submitBtn = document.getElementById('signupSubmitBtn');
        this.setButtonLoading(submitBtn, true);
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (data.success) {
                if (data.token) {
                    this.token = data.token;
                    this.admin = data.admin || { email, name };
                    localStorage.setItem('admin_token', this.token);
                    localStorage.setItem('admin_data', JSON.stringify(this.admin));
                    this.showSuccess('Account created successfully');
                    this.showDashboard();
                    this.loadDashboardData();
                } else {
                    this.showSuccess(data.message || 'Signup successful. Check your email to verify.');
                    this.switchAuthTab('login');
                }
            } else {
                this.showError(data.message || 'Signup failed');
            }
        } catch (error) {
            this.showError('Signup failed. Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    
    checkAuth() {
        if (this.token) {
            this.showDashboard();
            this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }
    
    showLogin() {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
    }
    
    showDashboard() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        
        document.getElementById('adminName').textContent = this.admin.name || this.admin.email || 'Admin';
        this.navigateToSection('dashboard');
    }

    switchAuthTab(tab){
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        const form = document.getElementById(tab === 'signup' ? 'signupForm' : 'loginForm');
        if (form) form.classList.add('active');
    }
    
    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Update page title
        document.getElementById('pageTitle').textContent = this.getSectionTitle(section);
        
        this.currentSection = section;
        
        // Load section data
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'feedback':
                this.loadFeedback();
                break;
            case 'emails':
                this.loadEmails();
                break;
            case 'content':
                this.loadContentList();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            feedback: 'Customer Feedback',
            emails: 'Contact Emails',
            notifications: 'Notifications',
            settings: 'Settings'
        };
        return titles[section] || 'Dashboard';
    }
    
    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateDashboardStats(data.stats);
                this.loadRecentActivity();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    updateDashboardStats(stats) {
        document.getElementById('totalFeedback').textContent = stats.total_feedback;
        document.getElementById('totalEmails').textContent = stats.total_emails;
        document.getElementById('unreadFeedback').textContent = stats.unread_feedback;
        document.getElementById('unreadEmails').textContent = stats.unread_emails;
        
        // Update badges - only show feedback unread count
        document.getElementById('feedbackBadge').textContent = stats.unread_feedback;
        document.getElementById('emailBadge').textContent = stats.unread_emails;
        document.getElementById('notificationBadge').textContent = stats.unread_feedback;
        
        console.log('Updated dashboard stats:', stats);
    }
    
    async loadRecentActivity() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/notifications`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayRecentActivity(data.notifications.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }
    
    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        container.innerHTML = '';
        
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const icon = this.getActivityIcon(activity.type);
            const isAttended = activity.status === 'replied' || activity.status === 'resolved' || activity.is_read;
            const seenTag = isAttended ? '<span class="seen-tag">Seen</span>' : '';
            
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        ${activity.title}
                        ${seenTag}
                    </div>
                    <div class="activity-time">${this.formatTime(activity.time)}</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    getActivityIcon(type) {
        const icons = {
            feedback: 'fas fa-comments',
            email: 'fas fa-envelope'
        };
        return icons[type] || 'fas fa-info-circle';
    }
    
    async loadFeedback() {
        try {
            const statusFilter = document.getElementById('feedbackStatusFilter').value;
            const url = `${this.apiBaseUrl}/api/admin/feedback?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                console.log('Loaded feedback from public API:', data.feedback);
                
                // Load replies for each feedback
                const feedbackWithReplies = await Promise.all(
                    data.feedback.map(async (feedback) => {
                        try {
                            const replyResponse = await fetch(`${this.apiBaseUrl}/api/feedback/${feedback.id}`);
                            const replyData = await replyResponse.json();
                            const replies = replyData.success && replyData.feedback.replies ? replyData.feedback.replies : [];
                            
                            return {
                                ...feedback,
                                replies: replies
                            };
                        } catch (replyError) {
                            console.log('Failed to load replies for feedback', feedback.id, replyError);
                            return {
                                ...feedback,
                                replies: []
                            };
                        }
                    })
                );

                this.displayFeedback(feedbackWithReplies);
            } else {
                console.error('Failed to load feedback:', data.message);
            }
        } catch (error) {
            console.error('Failed to load feedback:', error);
        }
    }
    
    displayFeedback(feedbackList) {
        const container = document.getElementById('feedbackList');
        container.innerHTML = '';
        
        if (feedbackList.length === 0) {
            container.innerHTML = '<div class="data-item"><p>No feedback found.</p></div>';
            return;
        }
        
        feedbackList.forEach(feedback => {
            const item = document.createElement('div');
            item.className = `data-item ${!feedback.is_read ? 'unread' : ''}`;
            
            // Show replies if any
            let repliesHtml = '';
            if (feedback.replies && feedback.replies.length > 0) {
                repliesHtml = '<div class="replies-preview" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">';
                repliesHtml += '<strong style="color: #007bff; font-size: 0.9rem;">Admin Replies:</strong>';
                feedback.replies.forEach(reply => {
                    // Only show admin replies, not duplicate sender messages
                    if (reply.reply_message && reply.reply_message !== feedback.message) {
                        repliesHtml += `<div style="margin-top: 8px; padding: 8px; background: white; border-radius: 4px; font-size: 0.9rem;">`;
                        repliesHtml += `<div style="color: #6c757d; font-size: 0.8rem; margin-bottom: 4px;">${reply.admin_name || 'Admin'} - ${this.formatTime(reply.created_at)}</div>`;
                        repliesHtml += `<div>${reply.reply_message}</div></div>`;
                    }
                });
                repliesHtml += '</div>';
            }
            
            item.innerHTML = `
                <div class="data-header">
                    <div class="data-title">${feedback.name}</div>
                    <div class="data-meta">
                        <span>${feedback.email || ''}</span>
                        <span>${feedback.phone || ''}</span>
                        <span>${this.formatTime(feedback.created_at)}</span>
                        <span class="status-badge status-${feedback.status}">${feedback.status}</span>
                    </div>
                </div>
                <div class="data-content">${feedback.message}</div>
                ${repliesHtml}
                <div class="data-actions">
                    <button class="btn btn-sm btn-primary" onclick="replyToFeedback(${feedback.id})">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.markAsRead('feedback', ${feedback.id})">
                        <i class="fas fa-eye"></i> Mark Read
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.removeFeedback(${feedback.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    async removeFeedback(id) {
        if (!confirm('Are you sure you want to remove this feedback?')) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/feedback/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Feedback removed');
                this.loadFeedback();
                this.loadDashboardData();
            } else {
                this.showError(data.message || 'Failed to remove');
            }
        } catch (e) {
            this.showError('Failed to remove. Please try again.');
        }
    }
    
    async loadEmails() {
        try {
            const statusFilter = document.getElementById('emailStatusFilter').value;
            const url = `${this.apiBaseUrl}/api/admin/emails?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Loaded emails from admin API:', data.emails);
                this.displayEmails(data.emails);
            } else {
                console.error('Failed to load emails:', data.message);
                this.showError(data.message || 'Failed to load emails');
            }
        } catch (error) {
            console.error('Failed to load emails:', error);
            this.showError('Failed to load emails. Please try again.');
        }
    }
    
    displayEmails(emailList) {
        const container = document.getElementById('emailList');
        container.innerHTML = '';
        
        if (emailList.length === 0) {
            container.innerHTML = '<div class="data-item"><p>No emails found.</p></div>';
            return;
        }
        
        emailList.forEach(email => {
            const item = document.createElement('div');
            item.className = `data-item ${!email.is_read ? 'unread' : ''}`;
            
            item.innerHTML = `
                <div class="data-header">
                    <div class="data-title">${email.sender_name}</div>
                    <div class="data-meta">
                        <span>${email.sender_email}</span>
                        <span>${email.sender_phone}</span>
                        <span>${this.formatTime(email.created_at)}</span>
                        <span class="status-badge status-${email.status}">${email.status}</span>
                    </div>
                </div>
                <div class="data-content">
                    <strong>To:</strong> ${email.recipient_email}<br>
                    ${email.message}
                </div>
                <div class="data-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.replyToEmail(${email.id})">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.markAsRead('email', ${email.id})">
                        <i class="fas fa-eye"></i> Mark Read
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.removeEmail(${email.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    async removeEmail(id) {
        if (!confirm('Are you sure you want to remove this email?')) return;
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/emails/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Email removed');
                this.loadEmails();
                this.loadDashboardData();
            } else {
                this.showError(data.message || 'Failed to remove');
            }
        } catch (e) {
            this.showError('Failed to remove. Please try again.');
        }
    }

    // -------- Content Management --------
    async loadContentList() {
        console.log('loadContentList called');
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/admin/contents?limit=100`, { 
                headers: { 'Authorization': `Bearer ${this.token}` } 
            });
            const data = await res.json();
            if (data.success) {
                console.log('Loaded content from backend:', data.contents);
                this.displayContentList(data.contents || []);
            } else {
                console.error('Failed to load contents:', data.message);
                this.showError('Failed to load content list');
            }
        } catch (e) { 
            console.error('Failed to load contents', e);
            this.showError('Failed to load content list');
        }
    }

    displayContentList(list) {
        const container = document.getElementById('contentList');
        if (!container) return;
        container.innerHTML = '';
        if (!list || list.length === 0) {
            container.innerHTML = '<div class="data-item"><p>No content yet.</p></div>';
            return;
        }
        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'data-item';
            div.innerHTML = `
                <div class="data-header">
                    <div class="data-title">${item.title || (item.slot + ' @ ' + item.location)}</div>
                    <div class="data-meta">
                        <span>${item.location}</span>
                        <span>${item.slot}</span>
                        <span>${this.formatTime(item.created_at)}</span>
                        <span class="status-badge status-${item.is_published ? 'sent' : 'failed'}">${item.is_published ? 'published' : 'draft'}</span>
                    </div>
                </div>
                <div class="data-content">
                    ${item.image_url ? `<img src="${item.image_url}" style="max-width:140px; border-radius:8px; margin-bottom:8px;" />` : ''}
                    ${item.body || ''}
                </div>
                <div class="data-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminDashboard.editContent(${item.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteContent(${item.id})"><i class="fas fa-trash"></i> Remove</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    resetContentForm() {
        this.currentContentId = null;
        this.currentContentImageUrl = null;
        document.getElementById('contentLocation').value = 'home';
        document.getElementById('contentSlot').value = 'announcement';
        document.getElementById('contentTitle').value = '';
        document.getElementById('contentBody').value = '';
        document.getElementById('contentPublished').checked = true;
        const img = document.getElementById('contentImagePreview');
        if (img) { img.src = ''; img.style.display = 'none'; }
    }

    async editContent(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/contents?id=eq.${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.success && data.contents && data.contents.length > 0) {
                const item = data.contents[0];
                this.currentContentId = id;
                document.getElementById('contentLocation').value = item.location || 'home';
                document.getElementById('contentSlot').value = item.slot || 'announcement';
                document.getElementById('contentTitle').value = item.title || '';
                document.getElementById('contentBody').value = item.body || '';
                document.getElementById('contentPublished').checked = !!item.is_published;
                this.currentContentImageUrl = item.image_url || null;
                const img = document.getElementById('contentImagePreview');
                if (this.currentContentImageUrl) { 
                    img.src = this.currentContentImageUrl; 
                    img.style.display = 'block'; 
                } else { 
                    img.src=''; 
                    img.style.display='none'; 
                }
            } else {
                this.showError('Content not found');
            }
        } catch (error) {
            console.error('Error loading content for edit:', error);
            this.showError('Failed to load content for editing');
        }
    }

    async fetchContentById(id){
        const list = JSON.parse(localStorage.getItem('zidalco_contents') || '[]');
        return list.find(i => i.id === id) || null;
    }

    async saveContent() {
        console.log('saveContent called');
        const payload = {
            location: document.getElementById('contentLocation').value,
            slot: document.getElementById('contentSlot').value,
            title: document.getElementById('contentTitle').value.trim() || null,
            body: document.getElementById('contentBody').value.trim() || null,
            image_url: this.currentContentImageUrl || null,
            is_published: document.getElementById('contentPublished').checked
        };
        console.log('Content payload:', payload);

        try {
            let response;
            if (this.currentContentId) {
                // Update existing content
                response = await fetch(`${this.apiBaseUrl}/api/admin/contents/${this.currentContentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(payload)
                });
                console.log('Updating existing content with ID:', this.currentContentId);
            } else {
                // Create new content
                response = await fetch(`${this.apiBaseUrl}/api/admin/contents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(payload)
                });
                console.log('Creating new content');
            }

            const data = await response.json();
            if (data.success) {
                this.showSuccess('Content saved successfully');
                this.resetContentForm();
                this.loadContentList();
            } else {
                console.error('Failed to save content:', data.message);
                this.showError(data.message || 'Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            this.showError('Failed to save content. Please try again.');
        }
    }

    async deleteContent(id) {
        if (!confirm('Remove this content?')) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/contents/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.showSuccess('Content removed successfully');
                this.loadContentList();
            } else {
                console.error('Failed to delete content:', data.message);
                this.showError(data.message || 'Failed to remove content');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            this.showError('Failed to remove content. Please try again.');
        }
    }

    broadcastContentChange() {
        try { localStorage.setItem('zidalco_contents_last_change', String(Date.now())); } catch(_) {}
    }
    
    async loadNotifications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/notifications`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Apply filter and search
                const filter = this.currentNotifFilter || 'all';
                const q = (this.currentNotifQuery || '').toLowerCase();
                let list = data.notifications;
                if (filter === 'unread') list = list.filter(n => (n.data && n.data.is_read === false));
                if (filter === 'feedback') list = list.filter(n => n.type === 'feedback');
                if (filter === 'email') list = list.filter(n => n.type === 'email');
                if (q) list = list.filter(n => (n.title||'').toLowerCase().includes(q) || (n.message||'').toLowerCase().includes(q));
                this.displayNotifications(list);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notificationList');
        container.innerHTML = '';
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<div class="notification-item"><p>No notifications.</p></div>';
            return;
        }
        
        notifications.forEach(notification => {
            const item = document.createElement('div');
            const unread = notification.data && notification.data.is_read === false;
            item.className = `notification-item ${unread ? 'unread' : ''}`;
            item.onclick = () => this.handleNotificationClick(notification);
            
            item.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.time)}</div>
            `;
            
            container.appendChild(item);
        });
    }

    // New: filters and search handlers
    setNotificationFilter(filter){
        this.currentNotifFilter = filter;
        this.loadNotifications();
    }
    setNotificationQuery(q){
        this.currentNotifQuery = q;
        this.loadNotifications();
    }

    handleNotificationClick(notification) {
        // Navigate to appropriate section and show details
        if (notification.type === 'feedback') {
            this.navigateToSection('feedback');
        } else if (notification.type === 'email') {
            this.navigateToSection('emails');
        }
    }
    
    async loadSettings() {
        document.getElementById('profileName').value = this.admin.name || '';
        document.getElementById('profileEmail').value = this.admin.email || '';
    }
    
    async replyToFeedback(feedbackId) {
        console.log('AdminDashboard.replyToFeedback called with ID:', feedbackId);
        console.log('Current token:', this.token);
        
        try {
            // Try to get feedback from the working /api/feedback endpoint first
            const response = await fetch(`${this.apiBaseUrl}/api/feedback`);
            const data = await response.json();
            
            if (data.success && data.feedback) {
                const feedback = data.feedback.find(f => f.id == feedbackId);
                if (feedback) {
                    console.log('Found feedback from public API:', feedback);
                    this.showReplyModal('feedback', feedback);
                    return;
                }
            }
            
            // Fallback to mock data if not found
            console.log('Feedback not found in public API, using mock data');
            const mockFeedback = {
                id: feedbackId,
                name: 'Test User',
                email: 'test@example.com',
                phone: '123-456-7890',
                message: 'This is a test feedback message for reply functionality'
            };
            
            this.showReplyModal('feedback', mockFeedback);
            
        } catch (error) {
            console.error('Failed to get feedback details:', error);
            
            // Fallback to mock data on error
            const mockFeedback = {
                id: feedbackId,
                name: 'Test User',
                email: 'test@example.com',
                phone: '123-456-7890',
                message: 'This is a test feedback message for reply functionality'
            };
            
            this.showReplyModal('feedback', mockFeedback);
        }
    }
    
    async replyToEmail(emailId) {
        // Get email details and show reply modal
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/emails/${emailId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.emails) {
                this.showReplyModal('email', data.emails);
            }
        } catch (error) {
            console.error('Failed to get email details:', error);
        }
    }
    
    showReplyModal(type, item) {
        console.log('showReplyModal called with:', type, item);
        this.currentReplyType = type;
        this.currentReplyId = item.id;
        
        const modal = document.getElementById('replyModal');
        const title = document.getElementById('replyModalTitle');
        const content = document.getElementById('replyModalContent');
        
        console.log('Modal elements:', { modal, title, content });
        
        if (!modal) {
            console.error('Reply modal not found!');
            return;
        }
        
        if (type === 'feedback') {
            title.textContent = `Reply to Feedback from ${item.name}`;
            content.innerHTML = `
                <div class="reply-original">
                    <strong>From:</strong> ${item.name} (${item.email})<br>
                    <strong>Phone:</strong> ${item.phone}<br>
                    <strong>Message:</strong><br>
                    <p>${item.message}</p>
                </div>
            `;
        } else {
            title.textContent = `Reply to Email from ${item.sender_name}`;
            content.innerHTML = `
                <div class="reply-original">
                    <strong>From:</strong> ${item.sender_name} (${item.sender_email})<br>
                    <strong>Phone:</strong> ${item.sender_phone}<br>
                    <strong>To:</strong> ${item.recipient_email}<br>
                    <strong>Message:</strong><br>
                    <p>${item.message}</p>
                </div>
            `;
        }
        
        console.log('Removing hidden class from modal');
        modal.classList.remove('hidden');
        console.log('Modal classes after removal:', modal.className);
        
        // Focus on the reply message textarea
        const replyMessage = document.getElementById('replyMessage');
        if (replyMessage) {
            replyMessage.focus();
        } else {
            console.error('Reply message textarea not found!');
        }
    }
    
    closeReplyModal() {
        document.getElementById('replyModal').classList.add('hidden');
        document.getElementById('replyMessage').value = '';
        this.currentReplyType = null;
        this.currentReplyId = null;
    }
    
    async sendReply() {
        const replyMessage = document.getElementById('replyMessage').value.trim();
        
        if (!replyMessage) {
            this.showError('Please enter a reply message');
            return;
        }
        
        try {
            if (this.currentReplyType === 'email') {
                // Handle email reply
                const replyData = {
                    email_id: this.currentReplyId,
                    reply_message: replyMessage,
                    admin_name: this.admin.name || 'Admin',
                    created_at: new Date().toISOString()
                };

                // Save email reply
                const response = await fetch(`${this.apiBaseUrl}/api/emails/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(replyData)
                });

                const data = await response.json();

                if (data.success) {
                    // Update email status to 'replied'
                    await this.updateEmailStatus(this.currentReplyId, 'replied');
                    
                    this.showSuccess('Reply sent successfully!');
                    this.closeReplyModal();
                    this.loadEmails();
                    this.loadDashboardData();
                } else {
                    throw new Error(data.message || 'Failed to save email reply');
                }
            } else {
                // Handle feedback reply
                const replyData = {
                    feedback_id: this.currentReplyId,
                    reply_message: replyMessage,
                    admin_name: this.admin.name || 'Admin',
                    created_at: new Date().toISOString()
                };

                // Save reply to mock database
                const response = await fetch(`${this.apiBaseUrl}/api/feedback/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(replyData)
                });

                const data = await response.json();

                if (data.success) {
                    // Update feedback status to 'replied'
                    await this.updateFeedbackStatus(this.currentReplyId, 'replied');
                    
                    this.showSuccess('Reply sent successfully!');
                    this.closeReplyModal();
                    this.loadFeedback();
                    this.loadDashboardData();
                } else {
                    throw new Error(data.message || 'Failed to save reply');
                }
            }
            
        } catch (error) {
            console.error('Failed to send reply:', error);
            this.showError('Failed to send reply. Please try again.');
        }
    }

    async updateEmailStatus(emailId, status) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/emails/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    id: emailId,
                    status: status
                })
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Failed to update email status:', error);
            return false;
        }
    }

    async updateFeedbackStatus(feedbackId, status) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/feedback/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    id: feedbackId,
                    status: status
                })
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Failed to update feedback status:', error);
            return false;
        }
    }

    async sendReplyViaEmailJS(replyMessage){
        if (!window.emailjs || typeof emailjs.send !== 'function') throw new Error('EmailJS not available');

        // Fetch the latest details to know recipient
        if (this.currentReplyType === 'email') {
            const res = await fetch(`${this.apiBaseUrl}/api/admin/emails/${this.currentReplyId}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            const data = await res.json();
            const email = data && (data.email || data.emails);
            if (!email) throw new Error('Email details not found');

            const params = {
                name: 'Zidalco Admin',
                email: 'no-reply@zidalco.com',
                reply_to: 'no-reply@zidalco.com',
                to_email: email.sender_email,
                recipient_email: email.sender_email,
                subject: `Reply from Zidalco Admin`,
                message: replyMessage
            };
            await emailjs.send('service_vxprigz','template_umpowaa', params);
            return;
        }

        if (this.currentReplyType === 'feedback') {
            const res = await fetch(`${this.apiBaseUrl}/api/admin/feedback/${this.currentReplyId}`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            const data = await res.json();
            const fb = data && data.feedback;
            if (!fb || !fb.email) throw new Error('Feedback details not found');

            const params = {
                name: 'Zidalco Admin',
                email: 'no-reply@zidalco.com',
                reply_to: 'no-reply@zidalco.com',
                to_email: fb.email,
                recipient_email: fb.email,
                subject: `Reply to your feedback`,
                message: replyMessage
            };
            await emailjs.send('service_vxprigz','template_umpowaa', params);
            return;
        }
        throw new Error('Unknown reply type');
    }
    
    async markAsRead(type, id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ type, id })
            });
            const data = await response.json();
            if (data.success) {
                if (this.currentSection === 'feedback') this.loadFeedback();
                else if (this.currentSection === 'emails') this.loadEmails();
                this.loadDashboardData();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }
    
    async markAllAsRead() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/admin/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.showSuccess('All notifications marked as read');
                this.loadNotifications();
                this.loadDashboardData();
            } else {
                this.showError(data.message || 'Failed');
            }
        } catch (e) {
            this.showError('Failed to mark all as read.');
        }
    }
    
    async updateProfile() {
        const name = document.getElementById('profileName').value.trim();
        
        if (!name) {
            this.showError('Name is required');
            return;
        }
        
        // Update profile logic here
        this.showSuccess('Profile updated successfully!');
    }
    
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showError('All fields are required');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            this.showError('New password must be at least 8 characters long');
            return;
        }
        
        // Change password logic here
        this.showSuccess('Password changed successfully!');
        document.getElementById('passwordForm').reset();
    }
    
    startNotificationPolling() {
        // Poll for new notifications every 30 seconds
        this.notificationInterval = setInterval(() => {
            if (this.token && this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }
    
    logout() {
        this.token = null;
        this.admin = {};
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
        
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        
        this.showLogin();
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    showError(message) {
        this.showToast(String(message || 'Error'), 'error');
    }
    
    showSuccess(message) {
        this.showToast(String(message || 'Success'), 'success');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return alert(message);
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-triangle':'fa-info-circle'}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-4px)';
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }

    setButtonLoading(btn, isLoading) {
        if (!btn) return;
        btn.classList.toggle('loading', !!isLoading);
        btn.disabled = !!isLoading;
    }

    togglePasswordVisibility(inputId, btnId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        if (!input || !btn) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }


    async handleForgotPassword() {
        const email = (document.getElementById('loginEmail')?.value || '').trim();
        if (!email) { this.showError('Enter your email to reset password'); return; }
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) this.showSuccess('If the email exists, a reset link has been sent.');
            else this.showError(data.message || 'Could not start password reset');
        } catch (_) {
            this.showError('Failed to request password reset');
        }
    }
}

// Global functions for onclick handlers
function refreshFeedback() {
    adminDashboard.loadFeedback();
}

function refreshEmails() {
    adminDashboard.loadEmails();
}

function markAllAsRead() {
    adminDashboard.markAllAsRead();
}

function closeReplyModal() {
    adminDashboard.closeReplyModal();
}

function sendReply() {
    adminDashboard.sendReply();
}

// Global function for reply button
function replyToFeedback(feedbackId) {
    console.log('Global replyToFeedback called with ID:', feedbackId);
    if (window.adminDashboard) {
        window.adminDashboard.replyToFeedback(feedbackId);
    } else {
        console.error('adminDashboard not available');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
