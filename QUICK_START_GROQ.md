# 🚀 Quick Start - AI Prescription with Backend Groq

## What Changed?

Your hospital app now uses **backend environment variables** instead of storing API keys in the browser. This is secure and works like this:

```
Doctor writes prescription → Frontend calls Backend API → Backend calls Groq API
```

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Verify Environment Variable
Backend already has the Groq API key. Just confirm it's there:

```bash
cd backend
```

Check `.env` file contains:
```
GROQ_API_KEY=your_groq_api_key_here
```

✅ If it's there, you're good!

### Step 2: Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
✓ Server running on port 5000
✓ Connected to MongoDB
```

### Step 3: Start Frontend  
```bash
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173
```

### Step 4: Test AI Features
1. Open http://localhost:5173
2. Login as a doctor
3. Open an appointment
4. Click **"✨ Open AI Prescription Writer"**
5. Start typing a medicine name (e.g., "para")
6. You should see AI suggestions in 1-2 seconds!

---

## 🎯 What Works Now

### ✅ Medicine Suggestions
- Type medicine name → AI suggests options
- Shows dosage, frequency, duration automatically
- Uses Groq AI running on your backend

### ✅ Drug Interactions
- Add 2+ medicines → System checks for conflicts
- Displays warnings if interactions found
- Powered by Groq backend

### ✅ Patient Risk Assessment
- Automatically scores appointment urgency
- Uses patient symptoms + medical history
- Risk color-coded in appointment queue

### ✅ Hospital Medical Receipt
- Professional template with patient info
- Doctor details
- Prescription section with AI help
- Email delivery option

---

## 🔧 API Endpoints (Backend)

All these run through backend now:

```
GET  /api/ai/check-groq              → Verify system is working
POST /api/ai/medicine-suggestions    → Get medicine suggestions
POST /api/ai/check-interactions      → Check drug conflicts
POST /api/ai/assess-risk             → Score patient urgency
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/ai/medicine-suggestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medicineKeyword": "para",
    "patientAge": 30,
    "patientGender": "M",
    "symptoms": ["fever"]
  }'
```

---

## 🐛 Troubleshooting

### Problem: "Groq API Key Not Configured"
**Fix:**
1. Check `backend/.env` has `GROQ_API_KEY=gsk_...`
2. Restart backend (`Ctrl+C` then `npm run dev`)
3. Try again

### Problem: No medicine suggestions appear
**Check:**
1. Backend is running (`npm run dev` in backend folder)
2. No errors in backend terminal
3. Frontend can reach backend (check console for network errors)
4. Medicine name has 2+ characters

### Problem: Suggestions very slow
**Could be:**
1. Groq API rate limited - wait a minute
2. Network issue - check connection
3. Backend overloaded - restart with `npm run dev`

### Problem: JWT authentication error
**Fix:**
1. Login again to get fresh token
2. Clear browser localStorage if needed
3. Check that you're logged in as a doctor

---

## 📊 Testing Checklist

- [ ] Backend shows "Server running on port 5000"
- [ ] Frontend shows local dev server
- [ ] Can login to doctor account
- [ ] Can open an appointment
- [ ] "AI Prescription Writer" button visible
- [ ] Medicine suggestions appear when typing
- [ ] Can add medicines without errors
- [ ] Can see drug interaction warnings
- [ ] Can save prescription

---

## 📁 Key Files Modified

1. **backend/routes/aiRoutes.js** - New AI endpoints
2. **backend/server.js** - Routes registered
3. **frontend/src/utils/groqService.js** - Uses backend API
4. **frontend/src/components/Prescription.jsx** - AI prescription form
5. **frontend/src/pages/DoctorDashboard.jsx** - AI button integrated

---

## 🔐 Security

✅ API key is in backend only (not in browser)
✅ All requests authenticated with JWT
✅ No sensitive data exposed in frontend
✅ Environment variables protected

---

## 📞 Need Help?

1. Check logs in backend terminal for errors
2. Open browser console (F12) for frontend errors
3. Verify both servers are running on ports 5000 and 5173
4. Make sure MongoDB is accessible
5. Test Groq connection with provided test script:
   ```bash
   node backend/test-groq-setup.js
   ```

---

## 🎉 You're All Set!

Your hospital prescription system is now:
- Secure (API keys in backend)
- Fast (backend caching possible)
- Scalable (can add more Groq endpoints)
- Professional (hospital template)
- AI-powered (Groq LLM integration)

Happy prescribing! 💊✨
