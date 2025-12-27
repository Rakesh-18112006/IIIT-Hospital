# QR Code 400 Error - Debugging Guide

## Error Analysis

**Error**: `Failed to load resource: the server responded with a status of 400 (Bad Request)`  
**Endpoint**: `POST :5000/api/patient/scan-qr`  
**Cause**: Invalid QR data format being sent to backend

---

## What Does 400 Mean?

A 400 error means the **request data was invalid**. The server received your request but rejected it because:
- QR data is missing
- QR data is in wrong format
- QR data is missing required fields (userId, studentId, token)
- QR data contains invalid JSON

---

## Comprehensive Debugging with Console Logs

Enhanced logging has been added to help diagnose issues. When you try to scan a QR code, check the browser console and server logs for detailed messages.

### Browser Console (Frontend)

When you scan a QR code, you should see:

**Success Flow:**
```
📱 QR Data Type: string
📱 QR Data Length: 150
📱 QR Data Preview: {"userId":"...",
✅ QR Data Valid JSON: {userId: "...", studentId: "...", token: "...", generatedAt: "..."}
📤 Sending QR data to backend...
✅ QR Scan Success: {message: "QR code scanned successfully", student: {...}, ...}
```

**Error Flow:**
```
📱 QR Data Type: string
📱 QR Data Length: 0
No QR code data detected. Please try again.
```

OR

```
📱 QR Data Type: string
📱 QR Data Length: 150
❌ QR Data Parse Error: Unexpected token
Invalid QR code format: Unexpected token in JSON at position 0
```

### Server Logs (Backend Terminal)

**Success Flow:**
```
📱 [QR Scan] Incoming request
📱 [QR Scan] Data Type: string
📱 [QR Scan] Data Length: 150
📱 [QR Scan] Trimmed QR data length: 150
✅ [QR Scan] Doctor role verified: [doctorId]
📱 [QR Scan] Attempting to parse QR data...
📱 [QR Scan] QR Data Sample: {"userId":"507f1f77bcf86cd799439011",...
✅ [QR Scan] QR data parsed successfully
📱 [QR Scan] Decoded data: {userId: "507f...", studentId: "STU001", hasToken: true}
📱 [QR Scan] Looking up student: 507f1f77bcf86cd799439011
✅ [QR Scan] Student found: STU001
📱 [QR Scan] Medical records found: 5
📱 [QR Scan] Medical leaves found: 2
📱 [QR Scan] Diet recommendations found: 1
📱 [QR Scan] Medical documents found: 3
✅ [QR Scan] Sending response with all data
```

**Error Flow:**
```
📱 [QR Scan] Incoming request
📱 [QR Scan] Data Type: string
📱 [QR Scan] Data Length: 0
❌ [QR Scan] No QR data provided
```

---

## Common Issues & Solutions

### Issue 1: "No QR code data detected"

**Cause**: QR scanner didn't capture any data

**Solutions**:
1. **Improve lighting**: Make sure the QR code is well-lit
2. **Clear image**: Ensure QR code is not blurry
3. **Proper angle**: Point camera perpendicular to QR code
4. **Camera permission**: Allow browser camera access
5. **Try upload mode**: Use "Upload Image" instead of camera

**Debug Check**:
```
Look in browser console for:
📱 QR Data Length: 0  ← This means no data captured
```

---

### Issue 2: "Invalid QR code format"

**Cause**: QR data is not valid JSON

**Solutions**:
1. **Regenerate QR code**: Student should delete and generate new QR
2. **Clear QR image**: Upload/scan clearer QR code image
3. **Correct QR**: Make sure scanning student's QR, not another QR

**Debug Check**:
```
Browser console will show:
❌ QR Data Parse Error: [specific JSON error]
📱 QR Data Preview: [first 100 chars that failed to parse]

Server logs:
❌ [Parse] First 100 chars: [invalid data preview]
```

---

### Issue 3: "Student not found"

**Cause**: The QR code contains userId that doesn't exist in database

**Solutions**:
1. **Student account deleted**: Create student again
2. **Wrong student QR**: Make sure scanning correct student's QR
3. **Database issue**: Check MongoDB connection

**Debug Check**:
```
Server logs will show:
❌ [QR Scan] Student not found: [userId]

Browser console will show error:
Student not found. Please ensure the QR code is valid.
```

---

### Issue 4: "Missing required fields"

**Cause**: QR code doesn't contain userId, studentId, or token

**Solutions**:
1. **Corrupted QR**: QR code image is damaged
2. **Wrong QR**: Not scanning a hospital QR code
3. **Regenerate**: Student should delete and create new QR

**Debug Check**:
```
Server logs:
📱 [Parse] Missing fields - userId: false, studentId: true, token: false

This means userId and token are missing from QR data
```

---

## Step-by-Step Debugging Process

### Step 1: Check QR Code Generation (Student)

Open browser console (F12) and login as student:
```
1. Go to "My QR Code" tab
2. Click "Generate QR Code"
3. Check console for any errors
4. QR code image should display
```

### Step 2: Verify QR Code Data

The QR code contains JSON like:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "studentId": "STU001",
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "generatedAt": "2024-12-27T10:30:00.000Z"
}
```

All four fields MUST be present.

### Step 3: Test Camera Scanning (Doctor)

Open browser console (F12) and login as doctor:
```
1. Go to "QR Scanner" tab
2. Select "Camera Scan" mode
3. Click "Start Camera"
4. Allow camera permission
5. Point at QR code
6. Watch console for logs
```

**Expected console output**:
```
📱 QR Data Type: string
📱 QR Data Length: 150+
✅ QR Data Valid JSON: {...}
📤 Sending QR data to backend...
```

### Step 4: Check Server Logs

Open terminal where backend is running and watch for logs starting with `[QR Scan]`.

All logs should show checkmarks (✅) for success flow.

### Step 5: Test Upload Mode

If camera doesn't work:
```
1. Select "Upload Image" mode
2. Use student QR code screenshot/image
3. Select image file
4. Watch console for same logs
```

---

## Log Interpretation Guide

| Log | Meaning |
|-----|---------|
| 📱 | Information/debugging log |
| ✅ | Success, operation completed |
| ❌ | Error, something went wrong |
| 🔴 | Critical error |

### Frontend Logs
- `📱 QR Data Type`: What type of data the scanner returned
- `❌ QR Data Parse Error`: JSON parsing failed
- `📤 Sending QR data`: Sending to backend
- `✅ QR Scan Success`: Got response from backend

### Backend Logs
- `📱 [QR Scan] Incoming request`: Request received
- `✅ [QR Scan] Doctor role verified`: User is a doctor
- `✅ [QR Scan] QR data parsed successfully`: Valid JSON
- `❌ [QR Scan] Student not found`: User ID in QR doesn't exist

---

## Common HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Invalid QR data format - check logs |
| 403 | Forbidden | Not logged in as doctor |
| 404 | Not Found | Student not found - check userId |
| 500 | Server Error | Backend error - check server logs |

---

## Testing Checklist

- [ ] Browser console shows detailed logs
- [ ] Server terminal shows [QR Scan] logs
- [ ] All checkmarks (✅) appear in success flow
- [ ] QR data is valid JSON with all 4 fields
- [ ] Doctor role is verified on server
- [ ] Student lookup succeeds
- [ ] Medical data is retrieved
- [ ] Response sent successfully

---

## React DevTools Recommendation

For better frontend debugging:
1. Install React DevTools extension: https://react.dev/link/react-devtools
2. Open DevTools in browser (F12)
3. Go to "React" tab to inspect component state
4. Check state variables:
   - `qrScanResult` - should contain patient data
   - `qrScanError` - shows error messages
   - `qrScannerLoading` - shows loading state

---

## Quick Troubleshooting Commands

**Check MongoDB Connection:**
```bash
# In terminal
mongosh
use hospital_db
db.users.findOne({role: "student"})
```

**Check Student QR Code Exists:**
```bash
mongosh
use hospital_db
db.users.findOne({studentId: "STU001"}, {qrCode: 1, qrCodeGenerated: 1})
```

**View All Logs at Once:**
Keep these open:
- Backend terminal: Watch for [QR Scan] logs
- Browser console: Watch for 📱 and ✅/❌ logs
- Network tab: See actual API response

---

## If Still Having Issues

1. **Restart Services**:
```bash
# Kill and restart backend
npm run dev

# Kill and restart frontend
npm run dev
```

2. **Clear Cache**:
- Frontend: Hard refresh (Ctrl+Shift+R)
- Browser: Clear cache (Ctrl+Shift+Delete)
- DevTools: Disable cache while open

3. **Check Network Tab**:
- Open DevTools
- Go to Network tab
- Try scanning QR
- Click on `/patient/scan-qr` request
- Check Request body and Response

4. **Verify QR Code Data**:
- Student should see QR image
- QR code should be scannable
- Generated QR should contain valid JSON

5. **Test with Different QR**:
- Generate new QR code
- Try scanning new one
- See if old QR is the issue

---

## Success Indicators

When everything works correctly, you should see:

**Frontend Console:**
```
✅ QR Data Valid JSON
📤 Sending QR data to backend...
✅ QR Scan Success
```

**Server Console:**
```
✅ [QR Scan] Doctor role verified
✅ [QR Scan] QR data parsed successfully
✅ [QR Scan] Student found
✅ [QR Scan] Sending response with all data
```

**Browser Display:**
- Patient information visible
- Medical records displayed
- Leaves shown
- Diet recommendations shown
- Documents listed

---

**Status**: Enhanced Debugging Ready ✅  
**Date**: December 27, 2025  
**Next**: Check console logs while testing QR scanning
