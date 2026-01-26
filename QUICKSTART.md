# CRM Software - Quick Start Guide

## 🚀 Ready to Deploy!

Your CRM software has been set up for deployment with **2 test accounts** that share all data.

### Test Accounts

| Account | Username | Password |
|---------|----------|----------|
| Account 1 | `admin` | `admin123` |
| Account 2 | `hr_manager` | `hr123` |

Both accounts have access to the **same database** - all data is shared. Only their profile names and avatars are different.

---

## 📋 Quick Deployment Checklist

### ✅ Already Done:
- [x] Multiple account system set up
- [x] Environment configuration ready
- [x] API configuration updated for production
- [x] Procfile created for Railway
- [x] Default test accounts created

### 🔄 Next Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy:**
   ```bash
   cd c:\Users\HP\Desktop\crm-software
   railway init
   railway up
   ```

4. **Get your URL** from Railway dashboard (e.g., `https://crm-software-prod.railway.app`)

5. **Update Frontend `.env.production`:**
   ```
   REACT_APP_API_URL=https://your-railway-backend-url
   ```

6. **Deploy Frontend** (to Vercel or Railway)

---

## 🔐 Security Notes

- **Change test passwords** after first login in production
- Use HTTPS only (Railway provides this automatically)
- Store sensitive data in Railway environment variables
- Don't commit `.env` files with real credentials

---

## 📁 Project Structure

```
crm-software/
├── index.js              # Backend (Express.js)
├── crm.db                # SQLite Database
├── Procfile              # Railway config
├── .env.example          # Environment template
├── DEPLOYMENT.md         # Full deployment guide
├── crm-frontend/         # React frontend
│   ├── src/config.js     # API configuration
│   └── .env.local        # Frontend local env
└── uploads/              # File uploads
```

---

## 🎯 Features Available

✨ **User Management**
- Multiple HR accounts with different profiles
- Shared database access
- Individual login sessions
- Profile avatars and customization

📊 **Core Features**
- Company management
- Job posting management
- Candidate tracking
- Lead management
- Interview scheduling
- Follow-ups & reminders
- Real-time notifications

---

## 💡 Tips

- Use Railway's free tier to get started (good for testing)
- Scale up to paid tier only when needed
- Monitor app performance in Railway dashboard
- Check logs in Railway for debugging
- Use `.env` files to manage configuration

---

## 📞 Support

For detailed instructions, see **DEPLOYMENT.md**

Need help? Common issues:
1. API not connecting → Check `.env.production` URL
2. Database error → Make sure crm.db is in root folder
3. Port conflicts → Change PORT in .env

---

## ✅ You're Ready!

Your CRM software is production-ready. Deploy with confidence! 🚀
