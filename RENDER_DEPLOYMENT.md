# 🚀 Render Backend Deployment Guide

## 📋 Prerequisites
- ✅ GitHub repository with backend code
- ✅ Render account (free tier available)
- ✅ Supabase project (for database)
- ✅ Email service credentials (Gmail/Outlook)

## 🔧 Step 1: Prepare Your Repository

### 1.1 Ensure All Files Are Committed
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin master
```

### 1.2 Verify Required Files
- ✅ `package.json` - Node.js dependencies
- ✅ `index.js` - Main application file
- ✅ `render.yaml` - Render configuration
- ✅ `production.env.example` - Environment variables template

## 🌐 Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `ZIdalco-Company`

### 2.3 Configure Service Settings
```
Name: zidalco-api
Environment: Node
Region: Oregon (US West)
Branch: master
Root Directory: (leave empty)
Build Command: npm install
Start Command: npm start
```

### 2.4 Set Environment Variables
Click **"Environment"** tab and add:

#### Required Variables:
```
NODE_ENV = production
PORT = 3000
SUPABASE_MOCK = false
ALLOWED_ORIGINS = https://www.mysite.com,https://mysite.com,https://zidalco.vercel.app
```

#### Database Variables (Get from Supabase):
```
SUPABASE_URL = your_supabase_project_url
SUPABASE_KEY = your_supabase_anon_key
```

#### Email Variables (Gmail Example):
```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your_email@gmail.com
EMAIL_PASS = your_app_password
```

#### Security Variables:
```
JWT_SECRET = your_secure_jwt_secret_here
BCRYPT_ROUNDS = 12
```

### 2.5 Advanced Settings
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes (from master branch)
- **Plan**: Free (or upgrade as needed)

## 🚀 Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your API will be available at: `https://zidalco-api.onrender.com`

## 🔗 Step 4: Update Frontend API URLs

### 4.1 Update Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update `NEXT_PUBLIC_API_URL` to your Render URL:
   ```
   NEXT_PUBLIC_API_URL = https://zidalco-api.onrender.com
   ```

### 4.2 Update Frontend Code (if needed)
The frontend should automatically use the new API URL from environment variables.

## ✅ Step 5: Test Your Deployment

### 5.1 Test API Endpoints
```bash
# Health check
curl https://zidalco-api.onrender.com/api/health

# Test feedback endpoint
curl -X POST https://zidalco-api.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### 5.2 Test Frontend Integration
1. Visit your Vercel frontend
2. Try submitting a contact form
3. Check if data appears in your admin dashboard

## 🔧 Troubleshooting

### Common Issues:

#### 1. Build Fails
- Check `package.json` dependencies
- Ensure Node.js version compatibility
- Check build logs in Render dashboard

#### 2. Environment Variables Not Working
- Verify all required variables are set
- Check variable names match exactly
- Restart service after adding variables

#### 3. CORS Errors
- Update `ALLOWED_ORIGINS` with your frontend URL
- Check frontend is using correct API URL

#### 4. Database Connection Issues
- Verify Supabase credentials
- Check if `SUPABASE_MOCK=false` is set
- Test database connection in Supabase dashboard

## 📊 Monitoring

### Render Dashboard
- View logs in real-time
- Monitor service health
- Check resource usage

### Health Check
- Endpoint: `https://zidalco-api.onrender.com/api/health`
- Should return: `{"status":"ok","timestamp":"..."}`

## 🔄 Updates

### Automatic Deployments
- Push to `master` branch triggers automatic deployment
- Check deployment status in Render dashboard

### Manual Deployments
- Go to Render dashboard
- Click **"Manual Deploy"**
- Select branch to deploy

## 💰 Cost Management

### Free Tier Limits
- 750 hours/month
- Service sleeps after 15 minutes of inactivity
- Cold start takes ~30 seconds

### Upgrade Options
- Starter Plan: $7/month
- Standard Plan: $25/month
- Pro Plan: $85/month

## 🎯 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Update frontend API URLs
3. ✅ Test full integration
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring and alerts

---

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)

---

**🎉 Congratulations! Your Zidalco backend is now deployed on Render!**
