# Zidalco Touchpoint System - Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)
- Your project code in a GitHub repository

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure all files are committed
3. Verify `package.json` and `vercel.json` are in the root directory

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Node.js project
6. Click "Deploy"

### Step 3: Configure Environment Variables (Optional)
In Vercel dashboard:
1. Go to your project settings
2. Go to "Environment Variables"
3. Add any variables you need (see .env.example)

### Step 4: Access Your Deployed App
- Your app will be available at: `https://your-project-name.vercel.app`
- Admin portal: `https://your-project-name.vercel.app/admin`
- Main website: `https://your-project-name.vercel.app`

## 🔧 Configuration

### Default Settings
- **Admin Email**: admin@zidalco.com
- **Admin Password**: admin123
- **Database**: In-memory mock database (resets on each deployment)
- **Email**: Mock email system (emails logged to console)

### Production Settings
For production, consider:
1. Setting up a real database (PostgreSQL, MongoDB)
2. Configuring real email service (SendGrid, Mailgun)
3. Setting up proper environment variables
4. Enabling HTTPS and security headers

## 📁 Project Structure
```
zidalco-touchpoint/
├── index.js                 # Main server file
├── package.json            # Dependencies
├── vercel.json             # Vercel configuration
├── admin/                  # Admin portal
├── routes/                 # API routes
├── utils/                  # Utility functions
├── css/                    # Stylesheets
├── Images/                 # Static images
└── *.html                  # Website pages
```

## 🛡️ Security Features
- Single admin account only
- Signup completely blocked
- Auto-logout after 30 minutes
- Password change through settings only
- Session management with activity tracking

## 📞 Support
For deployment issues, check:
1. Vercel deployment logs
2. Node.js version compatibility
3. Environment variables
4. File permissions

## 🔄 Updates
To update your deployment:
1. Push changes to GitHub
2. Vercel automatically redeploys
3. Changes go live within minutes
