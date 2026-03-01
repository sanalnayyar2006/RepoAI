# 🚀 Vercel Deployment Setup

## Your Backend URL
```
https://repoai-hmdz.onrender.com
```

---

## Step-by-Step Vercel Deployment

### 1. Commit Your Changes
```bash
git add .
git commit -m "Configure production backend URL"
git push origin main
```

### 2. Go to Vercel
Open: https://vercel.com/new

### 3. Import Your Repository
- Click "Import Git Repository"
- Select your GitHub repository
- Click "Import"

### 4. Configure Project Settings

#### Framework Preset
```
Vite
```

#### Root Directory
```
frontend
```

#### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. Add Environment Variable

Click "Environment Variables" and add:

**Key:**
```
VITE_API_URL
```

**Value:**
```
https://repoai-hmdz.onrender.com/api
```

**Apply to:**
- ✅ Production
- ✅ Preview
- ✅ Development

### 6. Deploy
Click "Deploy" button and wait 2-5 minutes.

---

## ✅ Verification Steps

### 1. Test Backend
Open in browser:
```
https://repoai-hmdz.onrender.com/api/analyze/facebook/react
```

Should return JSON data (may take 30 seconds on first request).

### 2. Test Frontend
After Vercel deployment completes:
1. Visit your Vercel URL
2. Sign up with any email/password
3. Try analyzing: `https://github.com/facebook/react`
4. Check all features work

---

## 🐛 If You Get CORS Errors

Update `backend/server.js` on Render:

```javascript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',  // Replace with your Vercel URL
    'http://localhost:5173'
  ],
  credentials: true
}));
```

Then commit and push to trigger Render redeploy.

---

## 📝 Environment Variables Summary

### What You Need in Vercel

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://repoai-hmdz.onrender.com/api` | Backend API endpoint |

### How to Add Later

If you need to update the environment variable:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Edit `VITE_API_URL`
5. Redeploy from Deployments tab

---

## 🎯 Quick Commands

### Test Backend Locally with Production API
```bash
cd frontend
echo "VITE_API_URL=https://repoai-hmdz.onrender.com/api" > .env.local
npm run dev
```

### Build for Production Locally
```bash
cd frontend
npm run build
npm run preview
```

### Deploy to Vercel via CLI (Alternative)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

---

## ✨ Your URLs

### Backend (Render)
- **API Base**: https://repoai-hmdz.onrender.com
- **API Endpoint**: https://repoai-hmdz.onrender.com/api
- **Test URL**: https://repoai-hmdz.onrender.com/api/analyze/facebook/react

### Frontend (Vercel)
- **Production**: https://[your-project].vercel.app (after deployment)

---

## 🔄 Auto-Deploy Setup

Both platforms auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render auto-deploys backend
# Vercel auto-deploys frontend
```

---

## 📊 Expected Behavior

### First Request to Backend
- Takes ~30 seconds (cold start on free tier)
- This is normal for Render free tier

### Subsequent Requests
- Fast (<1 second)
- Backend stays awake for 15 minutes

### Frontend
- Always fast
- No cold starts
- Instant page loads

---

## ✅ Deployment Checklist

- [x] Backend deployed to Render
- [x] Backend URL configured
- [x] Frontend `.env.production` updated
- [ ] Changes committed and pushed
- [ ] Vercel project created
- [ ] Environment variable added in Vercel
- [ ] Frontend deployed
- [ ] Both services tested

---

**Ready to deploy to Vercel? Follow the steps above! 🚀**
