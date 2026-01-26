# CRM Software - Deployment Guide

## Prerequisites
- Node.js installed
- npm installed
- Railway account (free at https://railway.app)

## Local Setup

1. **Install dependencies:**
```bash
npm install
cd crm-frontend
npm install
cd ..
```

2. **Run locally:**
```bash
node index.js
# In another terminal:
cd crm-frontend
npm start
```

Access at: http://localhost:3000

**Test Accounts:**
- Username: `admin` | Password: `admin123`
- Username: `hr_manager` | Password: `hr123`

---

## Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Create Railway Account
Visit https://railway.app and sign up (free tier available)

### Step 3: Login to Railway
```bash
railway login
```

### Step 4: Initialize Railway Project
```bash
cd c:\Users\HP\Desktop\crm-software
railway init
# Select "Create a new project"
# Name it: crm-software
```

### Step 5: Deploy Backend
```bash
railway up
```

This will:
- Build the Node.js backend
- Create a PostgreSQL database (optional, currently using SQLite)
- Deploy to Railway
- Give you a public URL (e.g., https://crm-software-prod.railway.app)

### Step 6: Set Environment Variables in Railway
1. Go to your Railway project dashboard
2. Click on the deployed service
3. Go to "Variables" tab
4. Add:
   - `PORT=5000`
   - `NODE_ENV=production`

### Step 7: Deploy Frontend
```bash
cd crm-frontend
```

Update `.env.production` with your Railway backend URL:
```
REACT_APP_API_URL=https://your-railway-url.railway.app
```

Build and deploy:
```bash
npm run build
railway up
```

Or deploy to Vercel for frontend:
```bash
npm install -g vercel
vercel deploy
```

### Step 8: Access Your App
Frontend: https://your-frontend-url
Backend API: https://your-backend-url

---

## Database in Production

Currently uses SQLite (crm.db). For production with multiple concurrent users:

### Option A: Use Railway PostgreSQL (Recommended)
```bash
railway add
# Select PostgreSQL
```

Then update index.js to use PostgreSQL instead of SQLite.

### Option B: Keep SQLite
Works fine for small teams (single file database, automatic created on first run).

---

## Features Available

✅ Multiple HR accounts with different profiles/avatars
✅ Shared database (all data visible to all users)
✅ Individual login sessions
✅ Real-time notifications
✅ Follow-ups management
✅ Interview scheduling
✅ Company & Jobs management
✅ Candidate tracking

---

## Troubleshooting

### Frontend can't connect to API
- Check if backend URL in `.env` is correct
- Make sure backend is running
- Check CORS settings in index.js

### Database file not found
- Place `crm.db` in root folder or let it auto-create
- Check folder permissions

### Port already in use
- Change PORT in .env file
- Or kill the process: `lsof -i :5000` (Mac/Linux)

---

## Support
For issues, check the logs in Railway dashboard or run locally to debug.
