# ⚡ RepoPilot AI - Quick Start Guide

Get up and running in 5 minutes!

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Terminal/Command Prompt**
- **Web Browser** (Chrome, Firefox, Safari, Edge)

---

## Installation

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `express` - Web server
- `axios` - HTTP client for GitHub API
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

This installs:
- `react` & `react-dom` - UI framework
- `axios` - API client
- `lucide-react` - Icons
- `vite` - Build tool

---

## Configuration (Optional)

### GitHub Token Setup

**Why?** Increases API rate limit from 60 to 5000 requests/hour.

**How?**

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `RepoPilot AI`
4. Expiration: 30 days
5. Scopes: **None needed** (for public repos)
6. Click "Generate token"
7. Copy the token

8. Edit `backend/.env`:
```env
PORT=5001
GITHUB_TOKEN=your_token_here
```

**Note:** Without a token, the app works fine but may hit rate limits on busy repos. It will automatically fall back to mock data.

---

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
node server.js
```

**Expected output:**
```
✅ RepoPilot AI backend running on http://localhost:5001
```

**Keep this terminal open!**

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal open!**

---

## Using the Application

### Step 1: Open Browser

Navigate to: **http://localhost:5173**

You should see the RepoPilot AI landing page.

### Step 2: Analyze a Repository

**Try these popular repos:**

1. **React** (busy, lots of PRs)
   ```
   https://github.com/facebook/react
   ```

2. **Next.js** (active development)
   ```
   https://github.com/vercel/next.js
   ```

3. **VS Code** (large codebase)
   ```
   https://github.com/microsoft/vscode
   ```

**Steps:**
1. Paste URL in search box
2. Click "Analyze"
3. Wait 3-5 seconds for analysis
4. Explore the dashboard!

### Step 3: Explore Features

**Maintainer View:**
- 🔀 PR Control - See AI-analyzed pull requests
- ⚡ Priority Queue - Auto-ranked by urgency
- 📋 Issue Analyzer - Roadmap generation
- 🔔 Ping Monitor - Noise detection
- 📊 Health Score - Project vitality

**Contributor View:**
- 🔀 My PR Status - Track your submission
- ⚡ Conflict Helper - Resolve merge conflicts
- 🎯 Good First Issues - Find beginner tasks
- 🤖 AI Pre-Review - Check code before submitting

---

## Troubleshooting

### Backend won't start

**Error:** `Port 5001 is already in use`

**Solution:**
```bash
# Kill process on port 5001
# macOS/Linux:
lsof -ti:5001 | xargs kill -9

# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

Or change port in `backend/.env`:
```env
PORT=5002
```

And update frontend API URL in `frontend/src/App.jsx`:
```javascript
const API_BASE_URL = 'http://localhost:5002/api';
```

---

### Frontend won't start

**Error:** `EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Kill process on port 5173
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or Vite will automatically suggest another port (5174).

---

### GitHub API Rate Limit

**Error:** Mock data banner appears

**Cause:** Hit 60 requests/hour limit (unauthenticated)

**Solutions:**
1. Add GitHub token to `backend/.env` (see Configuration above)
2. Wait 1 hour for rate limit reset
3. Use mock data (fully functional for demo)

---

### CORS Error

**Error:** `Access to fetch at 'http://localhost:5001' has been blocked by CORS policy`

**Cause:** Backend not running or wrong URL

**Solution:**
1. Ensure backend is running on port 5001
2. Check `frontend/src/App.jsx` has correct API URL:
   ```javascript
   const API_BASE_URL = 'http://localhost:5001/api';
   ```

---

### Empty Dashboard

**Cause:** Repository has no open PRs or issues

**Solution:** Try a busier repo like:
- `https://github.com/facebook/react`
- `https://github.com/microsoft/vscode`
- `https://github.com/nodejs/node`

---

## Testing the Demo

### Quick Test Checklist

- [ ] Landing page loads
- [ ] Can enter repo URL
- [ ] Loading animation appears
- [ ] Dashboard shows data
- [ ] Can toggle Maintainer/Contributor views
- [ ] Can navigate between sections
- [ ] PR cards expand/collapse
- [ ] AI Pre-Review accepts code input
- [ ] Health Score displays correctly

### Sample Code for AI Pre-Review

```javascript
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].price == null) {
      console.log('Warning: null price');
      continue;
    }
    total = total + items[i].price;
  }
  return total;
}
```

**Expected AI feedback:**
- Replace `var` with `const`/`let`
- Remove `console.log`
- Use strict equality `===`
- Score: ~40-60/100

---

## Next Steps

### For Hackathon Demo

1. **Practice the demo** - Use `DEMO_SCRIPT.md`
2. **Prepare 3 repos** - Have URLs ready
3. **Test all features** - Click through every section
4. **Time yourself** - Aim for 8-10 minutes
5. **Prepare Q&A** - Review common questions

### For Development

1. **Read ARCHITECTURE.md** - Understand the system
2. **Explore the code** - Start with `backend/server.js`
3. **Add features** - See "Future Enhancements" in README
4. **Integrate OpenAI** - Replace mock AI with GPT-4
5. **Deploy** - Try Vercel (frontend) + Railway (backend)

---

## Common Commands

### Backend
```bash
# Start server
node server.js

# Start with auto-reload (install nodemon first)
npm install -g nodemon
nodemon server.js
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## File Structure Reference

```
RepoPilot-AI/
├── backend/
│   ├── .env                    # Configuration (create this)
│   ├── package.json            # Dependencies
│   ├── server.js               # Main API server
│   └── services/
│       ├── github.js           # GitHub API integration
│       └── ai.js               # AI analysis engine
├── frontend/
│   ├── package.json            # Dependencies
│   ├── vite.config.js          # Build config
│   ├── index.html              # HTML entry
│   └── src/
│       ├── main.jsx            # React entry
│       ├── App.jsx             # Main component
│       ├── App.css             # Styles
│       └── index.css           # Global styles
├── README.md                   # Main documentation
├── QUICKSTART.md              # This file
├── DEMO_SCRIPT.md             # Presentation guide
└── ARCHITECTURE.md            # Technical details
```

---

## Support

### Issues?

1. Check this guide first
2. Review error messages carefully
3. Ensure both servers are running
4. Try a different repository
5. Check GitHub token (if using)

### Still stuck?

- Review `ARCHITECTURE.md` for technical details
- Check browser console for errors (F12)
- Check terminal output for backend errors
- Try restarting both servers

---

## Success Checklist

You're ready to demo when:

- ✅ Both servers start without errors
- ✅ Landing page loads in browser
- ✅ Can analyze at least one repository
- ✅ All dashboard sections display data
- ✅ Can toggle between Maintainer/Contributor views
- ✅ AI Pre-Review accepts and analyzes code
- ✅ No console errors in browser (F12)

---

**You're all set! 🚀**

Now go to `DEMO_SCRIPT.md` to prepare your presentation.

Good luck with your hackathon! 🏆
