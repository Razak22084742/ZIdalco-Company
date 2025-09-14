# 🚀 Zidalco Deployment Guide

## Architecture Overview
- **Frontend (Static)**: Vercel → `www.mysite.com`
- **Backend (Dynamic)**: Render/Railway → `api.mysite.com`

## 📋 Prerequisites
1. Domain name (e.g., `mysite.com`)
2. Vercel account
3. Render or Railway account
4. Supabase account (for database)
5. Email service (Gmail/SendGrid)

## 🎯 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
```bash
# The frontend is already configured with:
# - vercel.json for routing
# - Dynamic API URL configuration
# - CORS-compatible API calls
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect the configuration
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.mysite.com
   ```
5. Deploy!

### Step 3: Custom Domain
1. In Vercel dashboard, go to Project Settings → Domains
2. Add your domain: `www.mysite.com`
3. Configure DNS records (see DNS section below)

## 🔧 Backend Deployment (Render/Railway)

### Option A: Render Deployment

#### Step 1: Prepare Repository
```bash
# Your backend is ready with:
# - render.yaml configuration
# - Dockerfile for containerization
# - Production environment setup
```

#### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select "Web Service"
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Plan**: Free

#### Step 3: Environment Variables
Set these in Render dashboard:
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_MOCK=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=your_jwt_secret
```

#### Step 4: Custom Domain
1. In Render dashboard, go to Settings → Custom Domains
2. Add domain: `api.mysite.com`
3. Configure DNS records (see DNS section below)

### Option B: Railway Deployment

#### Step 1: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect the configuration
4. Set environment variables (same as Render)

#### Step 2: Custom Domain
1. In Railway dashboard, go to Settings → Domains
2. Add domain: `api.mysite.com`
3. Configure DNS records (see DNS section below)

## 🌐 DNS Configuration

### At Your Domain Registrar (e.g., GoDaddy, Namecheap)

#### A Records
```
Type: A
Name: @
Value: 76.76.19.61 (Vercel IP)
TTL: 3600

Type: A
Name: www
Value: 76.76.19.61 (Vercel IP)
TTL: 3600
```

#### CNAME Records
```
Type: CNAME
Name: api
Value: your-render-app.onrender.com (or railway domain)
TTL: 3600
```

### Vercel DNS (Alternative)
1. In Vercel dashboard, go to Project Settings → Domains
2. Add both `mysite.com` and `www.mysite.com`
3. Configure DNS records in Vercel

## 🔐 Security Configuration

### Environment Variables Checklist
- [ ] `NODE_ENV=production`
- [ ] `SUPABASE_URL` and `SUPABASE_KEY`
- [ ] `EMAIL_USER` and `EMAIL_PASS`
- [ ] `JWT_SECRET` (strong random string)
- [ ] `BCRYPT_ROUNDS=12`

### CORS Configuration
The backend is configured to allow:
- `https://www.mysite.com`
- `https://mysite.com`
- `https://zidalco.vercel.app`
- All Vercel preview URLs

## 🧪 Testing Deployment

### Frontend Tests
```bash
# Test homepage
curl https://www.mysite.com

# Test admin panel
curl https://www.mysite.com/admin
```

### Backend Tests
```bash
# Test health endpoint
curl https://api.mysite.com/api/health

# Test CORS
curl -H "Origin: https://www.mysite.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.mysite.com/api/auth/login
```

## 📊 Monitoring & Maintenance

### Health Checks
- Frontend: Vercel automatically monitors
- Backend: `/api/health` endpoint configured

### Logs
- **Vercel**: Function logs in dashboard
- **Render**: Service logs in dashboard
- **Railway**: Deployment logs in dashboard

### Updates
1. Push changes to GitHub
2. Vercel auto-deploys frontend
3. Render/Railway auto-deploys backend
4. Test both environments

## 🚨 Troubleshooting

### Common Issues

#### CORS Errors
- Check allowed origins in `index.js`
- Verify domain configuration
- Test with browser dev tools

#### API Connection Issues
- Verify `api.mysite.com` DNS resolution
- Check backend health endpoint
- Review CORS configuration

#### Admin Login Issues
- Verify admin credentials: `admin@zidalco.com` / `admin123`
- Check rate limiting (5 attempts per 15 minutes)
- Review authentication logs

### Debug Commands
```bash
# Check DNS resolution
nslookup api.mysite.com
nslookup www.mysite.com

# Test API connectivity
curl -v https://api.mysite.com/api/health

# Test CORS
curl -H "Origin: https://www.mysite.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.mysite.com/api/contents
```

## 📈 Performance Optimization

### Frontend (Vercel)
- Static files served from CDN
- Automatic compression
- Image optimization
- Edge caching

### Backend (Render/Railway)
- Node.js clustering (if needed)
- Database connection pooling
- Rate limiting implemented
- Health checks configured

## 🔄 Backup & Recovery

### Database
- Supabase automatic backups
- Point-in-time recovery available

### Code
- GitHub repository as source of truth
- Vercel/Render/Railway auto-deployments

### Environment
- Environment variables documented
- Configuration files version controlled

---

## 🎉 Success Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render/Railway
- [ ] Custom domains configured
- [ ] DNS records updated
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Admin panel accessible
- [ ] API endpoints working
- [ ] Email functionality tested
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Monitoring configured

Your Zidalco website is now ready for production! 🚀
