# Groq Backend Setup Guide ✅

## Overview

The AI-powered prescription system has been successfully migrated from **frontend localStorage** (insecure) to **backend environment variables** (secure). This ensures:

- ✅ API key is never exposed in browser
- ✅ API key is protected in backend environment
- ✅ All Groq API calls go through authenticated backend endpoints
- ✅ Better performance and reliability

---

## Architecture

### Old Architecture (Not in Use)
```
Frontend (localStorage) → Groq API ❌ (Insecure)
```

### New Architecture (Active) ✅
```
Frontend → Backend REST API (/api/ai/*) → Groq API
         (axios call)        (uses env vars)
```

---

## Current Setup Status

### ✅ Backend Configuration Complete

**File**: `backend/.env`
```
GROQ_API_KEY=your_groq_api_key_here
```

**File**: `backend/routes/aiRoutes.js` 
- Uses `process.env.GROQ_API_KEY` to access the key securely
- 4 API endpoints created:
  - `GET /api/ai/check-groq` - Verify Groq is configured
  - `POST /api/ai/medicine-suggestions` - Get medicine suggestions
  - `POST /api/ai/check-interactions` - Check drug interactions  
  - `POST /api/ai/assess-risk` - Assess patient risk

**File**: `backend/server.js`
- Routes registered: `app.use("/api/ai", aiRoutes);`

### ✅ Frontend Service Updated

**File**: `frontend/src/utils/groqService.js`
- All functions now call backend endpoints via `api.post()` and `api.get()`
- No longer stores API key in localStorage
- No direct calls to Groq API
- Functions return consistent data structures

### ✅ Components Compatible

**File**: `frontend/src/components/Prescription.jsx`
- Already uses `.then()` for async function handling
- Properly awaits `getMedicineSuggestions()` and `checkMedicineInteractions()`
- Works seamlessly with backend API calls

**File**: `frontend/src/pages/DoctorDashboard.jsx`
- AI Prescription button integrated in hospital medical receipt
- Calls `isGroqConfigured()` to check backend status
- Opens Prescription modal with AI features

---

## Testing Guide

### 1. Verify Backend Setup

**Step 1: Check Environment Variable**
```bash
cd backend
echo $env:GROQ_API_KEY  # Windows PowerShell
# Should show: your_groq_api_key_here
```

**Step 2: Start Backend Server**
```bash
npm run dev
# Should see: Server running on port 5000
```

### 2. Test Groq Endpoint (Verify Backend Can Access Groq)

**Option A: Using Thunder Client or Postman**
1. Create new POST request
2. URL: `http://localhost:5000/api/ai/check-groq`
3. Headers:
   - `Authorization: Bearer <your_jwt_token>`
   - `Content-Type: application/json`
4. Expected Response:
   ```json
   {
     "configured": true,
     "message": "Groq API is configured"
   }
   ```

**Option B: Using curl**
```bash
curl -X GET http://localhost:5000/api/ai/check-groq \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Medicine Suggestions (End-to-End)

**In Frontend - DoctorDashboard:**
1. Click "Open AI Prescription Writer" button
2. Start typing in medicine field: "para"
3. Wait 500ms for debounce
4. Should see suggestions dropdown with:
   - Paracetamol 500mg
   - Paracetamol + dosage info
   - Full prescription details

**Expected Flow:**
```
User types "para"
  ↓
Frontend calls: api.post("/ai/medicine-suggestions", ...)
  ↓
Backend receives request
  ↓
Backend calls: axios.post(GROQ_API_URL, {...headers with env GROQ_API_KEY...})
  ↓
Groq responds with suggestions
  ↓
Backend returns to frontend
  ↓
Frontend displays in dropdown
```

### 4. Test Drug Interactions Check

**In Prescription Modal:**
1. Add 2 or more medicines
2. Check console and UI for interaction warnings
3. System should call `/api/ai/check-interactions` automatically
4. Should display warnings if any interactions found

### 5. Test Patient Risk Assessment

**In Appointment Queue:**
1. Appointments should show risk levels
2. System calls `/api/ai/assess-risk` for each appointment
3. Risk scores appear in hospital medical receipt

---

## Environment Variables

### Required in `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=rakesh_12345
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```

### Groq Configuration (Backend)
```javascript
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TEMPERATURE = 0.3
GROQ_MAX_TOKENS = 1024
```

---

## API Endpoints

### 1. Check Groq Configuration
```
GET /api/ai/check-groq
Authentication: Required (JWT)

Response:
{
  "configured": boolean,
  "message": string
}
```

### 2. Get Medicine Suggestions
```
POST /api/ai/medicine-suggestions
Authentication: Required (JWT)

Body:
{
  "medicineKeyword": "para",
  "patientAge": 30,
  "patientGender": "M",
  "symptoms": ["fever", "headache"]
}

Response:
[
  {
    "fullName": "Paracetamol 500mg",
    "dosage": "500mg",
    "frequency": "3 times daily",
    "duration": "5-7 days",
    "instructions": "After meals"
  },
  ...
]
```

### 3. Check Medicine Interactions
```
POST /api/ai/check-interactions
Authentication: Required (JWT)

Body:
{
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg" },
    { "name": "Ibuprofen", "dosage": "400mg" }
  ]
}

Response:
{
  "hasInteractions": boolean,
  "warnings": [string],
  "suggestions": [string]
}
```

### 4. Assess Patient Risk
```
POST /api/ai/assess-risk
Authentication: Required (JWT)

Body:
{
  "symptoms": ["fever", "chest pain"],
  "medicalHistory": "Diabetes",
  "vitals": "BP: 140/90",
  "age": 65
}

Response:
{
  "riskLevel": "high",
  "riskScore": 75,
  "reason": "Multiple risk factors detected",
  "recommendations": [string]
}
```

---

## Frontend Service Functions

All functions in `groqService.js` now use backend:

```javascript
// Check if Groq is configured (calls backend)
await isGroqConfigured()  // → GET /api/ai/check-groq

// Get medicine suggestions (calls backend)
await getMedicineSuggestions(keyword, age, gender, symptoms)
// → POST /api/ai/medicine-suggestions

// Check drug interactions (calls backend)
await checkMedicineInteractions(medicines)
// → POST /api/ai/check-interactions

// Assess patient risk (calls backend)
await assessPatientRisk(symptoms, history, vitals, age)
// → POST /api/ai/assess-risk
```

---

## Error Handling

### Error: "Groq API Key Not Configured"
**Cause**: `GROQ_API_KEY` not in `backend/.env`
**Solution**:
1. Add key to `.env`: `GROQ_API_KEY=gsk_...`
2. Restart backend: `npm run dev`

### Error: "Cannot POST /api/ai/medicine-suggestions"
**Cause**: Routes not mounted in server.js
**Solution**: Verify `backend/server.js` has:
```javascript
import aiRoutes from "./routes/aiRoutes.js";
app.use("/api/ai", aiRoutes);
```

### Error: "401 Unauthorized"
**Cause**: JWT token missing or invalid
**Solution**: Ensure frontend sends valid JWT in Authorization header

### Error: "Groq rate limit exceeded"
**Cause**: Too many requests to Groq API
**Solution**: Implement request throttling or batch requests

---

## File Structure

```
backend/
├── .env                          ✅ Contains GROQ_API_KEY
├── server.js                     ✅ Mounts aiRoutes
└── routes/
    └── aiRoutes.js               ✅ 4 Groq endpoints

frontend/
├── src/
│   ├── utils/
│   │   └── groqService.js        ✅ Uses backend API
│   ├── components/
│   │   └── Prescription.jsx      ✅ Uses async functions
│   └── pages/
│       └── DoctorDashboard.jsx   ✅ Has AI prescription button
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCTOR DASHBOARD                          │
│                                                               │
│  [QR Scan] ──→ [Medical Receipt] ──→ [AI Prescription]     │
└─────────────────────────────────────────────────────────────┘
                                           ↓
┌─────────────────────────────────────────────────────────────┐
│              PRESCRIPTION COMPONENT (React)                  │
│                                                               │
│  Medicine Input ──→ [getMedicineSuggestions()]             │
│  Add Medicine    ──→ [checkMedicineInteractions()]          │
│  Patient Info    ──→ [assessPatientRisk()]                  │
└─────────────────────────────────────────────────────────────┘
           ↓ api.post() / api.get()
┌─────────────────────────────────────────────────────────────┐
│           BACKEND AI ROUTES (Express.js)                     │
│                                                               │
│  GET  /api/ai/check-groq              ─→ Verify Groq       │
│  POST /api/ai/medicine-suggestions    ─→ Get Medicines     │
│  POST /api/ai/check-interactions      ─→ Check Interactions│
│  POST /api/ai/assess-risk             ─→ Assess Risk       │
└─────────────────────────────────────────────────────────────┘
           ↓ process.env.GROQ_API_KEY
┌─────────────────────────────────────────────────────────────┐
│            GROQ CLOUD API (llama-3.3-70b)                    │
│                                                               │
│  Returns AI-powered:                                        │
│  • Medicine suggestions with dosage                          │
│  • Drug interaction warnings                                │
│  • Patient risk assessments                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Checklist

- [ ] Backend `.env` has `GROQ_API_KEY=gsk_...`
- [ ] Backend routes mounted: `app.use("/api/ai", aiRoutes)`
- [ ] Backend `aiRoutes.js` uses `process.env.GROQ_API_KEY`
- [ ] Frontend `groqService.js` calls `/api/ai/*` endpoints
- [ ] Frontend components use `.then()` for async functions
- [ ] Prescription component imports from `groqService`
- [ ] DoctorDashboard has "AI Prescription Writer" button
- [ ] Backend started with `npm run dev`
- [ ] Frontend can reach backend at `http://localhost:5000`
- [ ] JWT authentication working for API calls

---

## Security Notes

✅ **What's Secure Now:**
- API key in backend environment (not exposed in code)
- API key not in version control (only in `.env`)
- API key never sent to browser
- All API calls authenticated with JWT
- Backend validates all requests

✅ **Best Practices Applied:**
- Environment variables for secrets
- Protected middleware on all endpoints
- Error messages don't expose sensitive info
- Rate limiting ready (can add)
- Input validation on all endpoints

---

## Next Steps

1. **Start Backend**: `npm run dev` in `/backend`
2. **Start Frontend**: `npm run dev` in `/frontend`
3. **Test Medicine Suggestions**: Type in prescription modal
4. **Test Full Workflow**: QR scan → Write prescription → Check interactions
5. **Monitor Logs**: Check terminal for any errors
6. **Scale Up**: Add more Groq endpoints as needed

---

## Success Indicators

✅ **System is working when:**
1. Medicine suggestions appear when typing
2. No "Groq API Key Not Configured" error
3. Interaction warnings appear for conflicting medicines
4. Patient risk scores show in appointments
5. Prescriptions save successfully
6. Emails send with prescription details

---

**Status**: ✅ All systems configured and ready for testing!

For questions or issues, check the logs in both backend and frontend terminals.
