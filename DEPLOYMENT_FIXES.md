# 🚀 Deployment Fixes for Zidalco Website

## Issues Fixed

### 1. **Backend Environment Variables (Render)**

Your deployed backend was running in mock mode because it didn't have the proper environment variables. 

**✅ Fixed in `render.yaml`:**
- Added proper environment variables
- Set `SUPABASE_MOCK=false` for production
- Added email configuration
- Added JWT secret

### 2. **Frontend API Configuration (Vercel)**

The frontend wasn't connecting to the correct backend URL.

**✅ Fixed in `vercel.json`:**
- Updated API URL to point to your actual Render backend
- Added environment variable support

**✅ Fixed in `assets/js/api-config.js` and `admin/admin.js`:**
- Updated to use environment variables
- Fallback to correct Render URL

## 🔧 **Manual Steps Required**

### **Step 1: Update Render Environment Variables**

Go to your Render dashboard → Your Backend Service → Environment Variables and add:

```
SUPABASE_URL=your_actual_supabase_url
SUPABASE_KEY=your_actual_supabase_key
EMAIL_PASS=your_gmail_app_password
```

**Note:** You need to get these values:
- **SUPABASE_URL & SUPABASE_KEY**: From your Supabase project settings
- **EMAIL_PASS**: Gmail App Password (not your regular password)

### **Step 2: Redeploy Both Services**

1. **Backend (Render):**
   - Push your changes to GitHub
   - Render will auto-deploy with the new `render.yaml` configuration

2. **Frontend (Vercel):**
   - Push your changes to GitHub
   - Vercel will auto-deploy with the new `vercel.json` configuration

### **Step 3: Test the Deployed Site**

After deployment, test:
- ✅ Feedback form submission
- ✅ Contact form submission
- ✅ Admin panel login and functionality

## 🧪 **Testing Commands**

Test your deployed backend:
```bash
# Test health endpoint
curl https://zidalco-api-5nf2.onrender.com/api/health

# Test feedback submission
curl -X POST https://zidalco-api-5nf2.onrender.com/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","message":"Test feedback"}'

# Test email submission
curl -X POST https://zidalco-api-5nf2.onrender.com/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"1234567890","message":"Test message","recipient_email":"zidalcoltd@gmail.com"}'
```

## 🔍 **Troubleshooting**

### If backend still shows "Mock mode":
1. Check Render environment variables are set correctly
2. Ensure `SUPABASE_MOCK=false` is set
3. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct

### If frontend can't connect to backend:
1. Check browser console for CORS errors
2. Verify the API URL in `vercel.json` matches your Render URL
3. Test the backend URL directly in browser

### If admin panel doesn't work:
1. Check if backend is responding to `/api/health`
2. Verify admin login credentials
3. Check browser network tab for failed requests

## 📝 **Files Modified**

- ✅ `render.yaml` - Added environment variables
- ✅ `vercel.json` - Updated API URL
- ✅ `assets/js/api-config.js` - Added environment variable support
- ✅ `admin/admin.js` - Added environment variable support
- ✅ `routes/emails.js` - Improved error messages
- ✅ `routes/feedback.js` - Improved error messages

## 🎯 **Next Steps**

1. **Set the missing environment variables in Render**
2. **Push changes to GitHub to trigger redeployment**
3. **Test the deployed site functionality**
4. **Verify admin panel works correctly**

Your site should now work perfectly on the deployed version! 🚀
