# QR Code Implementation - Quick Start Guide

## What Was Implemented

### ✅ Backend Components

1. **User Model Update** - Added QR code fields to store unique QR codes
2. **QR Code Utility** - Utility functions to generate and parse QR codes
3. **Patient Controller** - Three new endpoints:
   - `POST /api/patient/generate-qr` - Generate QR code
   - `GET /api/patient/my-qr` - Get QR code
   - `POST /api/patient/scan-qr` - Scan and retrieve patient data
4. **Patient Routes** - Registered new endpoints with role-based access control

### ✅ Frontend Components

1. **Student Dashboard**
   - New "My QR Code" tab
   - Generate QR code functionality
   - Display and download QR code
   - Show student information

2. **Doctor Dashboard**
   - New "QR Scanner" tab
   - Paste QR data to scan
   - View complete patient information including:
     - Personal details
     - Medical history
     - Prescriptions
     - Medical leaves
     - Diet recommendations

## Installation Steps

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install qrcode uuid
```

**Frontend:**
```bash
cd frontend
npm install qr-scanner
```

### Step 2: Start Services

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

## How to Use

### Student Side

1. Login as a student
2. Go to "My QR Code" in the sidebar
3. Click "Generate QR Code" button
4. Share your QR code with doctors
5. Download it as PNG for easy access

### Doctor Side

1. Login as a doctor
2. Go to "QR Scanner" in the sidebar
3. Ask student to scan their QR code using any QR scanner app
4. Copy the decoded QR data (JSON format)
5. Paste it in the textarea
6. Click "Scan QR Code"
7. View complete patient information
8. Write prescription with full medical history access

## Testing the Feature

### Test Case 1: Generate Student QR Code
- Login as student
- Navigate to "My QR Code"
- Click "Generate QR Code"
- **Expected**: QR code image appears with student info

### Test Case 2: Download QR Code
- After generating, click "Download QR Code"
- **Expected**: PNG file downloads to your device

### Test Case 3: Scan QR Code (Doctor)
- Use any online QR scanner to scan the generated code
- Copy the JSON output
- Go to Doctor Dashboard > QR Scanner
- Paste the JSON
- Click "Scan QR Code"
- **Expected**: Patient information and medical records appear

## API Testing with Curl

### Generate QR Code
```bash
curl -X POST http://localhost:5000/api/patient/generate-qr \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get QR Code
```bash
curl -X GET http://localhost:5000/api/patient/my-qr \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Scan QR Code
```bash
curl -X POST http://localhost:5000/api/patient/scan-qr \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrData":"{\"userId\":\"...\",\"studentId\":\"...\",\"token\":\"...\",\"generatedAt\":\"...\"}"}'
```

## File Changes Summary

### Backend Files Modified
- `/backend/models/User.js` - Added qrCode fields
- `/backend/controllers/patientController.js` - Added 3 QR endpoints
- `/backend/routes/patientRoutes.js` - Registered QR routes
- `/backend/utils/qrCodeGenerator.js` - NEW - QR code utilities

### Backend Files Created
- `/backend/utils/qrCodeGenerator.js` - QR code generation logic

### Frontend Files Modified
- `/frontend/src/pages/StudentDashboard.jsx` - Added QR code UI
- `/frontend/src/pages/DoctorDashboard.jsx` - Added QR scanner UI

## Dependencies Added

### Backend
- `qrcode@^14.x` - QR code generation
- `uuid@^9.x` - Unique ID generation

### Frontend
- `qr-scanner@^2.x` - QR code scanning (optional, for future camera implementation)

## Security Features

✅ Role-based access control (students generate, doctors scan)
✅ Unique token in QR code for added security
✅ MongoDB ObjectId verification
✅ JWT token authentication on all endpoints
✅ Medical data accessible only to authenticated doctors

## Key Features

🎯 **One-Click QR Generation** - Students can generate QR in seconds
📱 **Downloadable QR Code** - Easy to print or share digitally
👨‍⚕️ **Instant Patient Access** - Doctors scan and see full history
📋 **Complete Medical History** - All records, leaves, and diet in one place
🔒 **Secure** - Only doctors can scan, data encrypted in transit
⚡ **Fast** - Real-time data retrieval

## Next Steps & Future Enhancements

1. Implement camera-based QR scanning in browser
2. Add QR code expiration dates
3. Create scan history/audit trail
4. Add ability to revoke QR codes
5. Mobile app development
6. Voice notifications for scans
7. Multi-language support
8. SMS/Email notifications when QR is scanned

## Troubleshooting

### QR Code not generating?
- Ensure you're logged in as a student
- Check browser console for errors
- Verify backend is running

### Doctor can't scan QR?
- Make sure QR data is valid JSON
- Check doctor is logged in with doctor role
- Verify student exists in database

### Medical records not showing?
- Student may need to submit symptoms first
- Records appear after doctor consultation
- Try refreshing the page

## Support & Documentation

See `QR_CODE_FEATURE.md` for detailed technical documentation.

## Summary

The QR code system is now fully functional! Students can generate unique QR codes that doctors can scan to instantly access their complete medical history, enabling faster and more informed prescription writing.
