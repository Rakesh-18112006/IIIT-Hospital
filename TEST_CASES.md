# QR Code System - Test Cases & Examples

## Test Environment Setup

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- One student account
- One doctor account

---

## 1. Student QR Code Generation Test

### Test Case 1.1: Generate QR Code Successfully

**Steps:**
1. Login as student
2. Navigate to "My QR Code" tab in sidebar
3. Click "Generate QR Code" button
4. Wait for generation to complete

**Expected Result:**
- QR code image appears
- Student information is displayed:
  - Name: [Student Name]
  - Student ID: [ID]
  - Email: [Email]
  - Status: Active (green badge)
- "Download QR Code" button is available
- How It Works section is visible
- Important security warning is displayed

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 1.2: Download QR Code

**Steps:**
1. After generating QR code (Test 1.1)
2. Click "Download QR Code" button
3. Check downloads folder

**Expected Result:**
- PNG file is downloaded named `qr-code-[STUDENT_ID].png`
- File size: 5-10 KB
- Image is valid and scannable

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 1.3: Retrieve Existing QR Code

**Steps:**
1. Login as same student
2. Navigate to "My QR Code" tab
3. QR code should load automatically

**Expected Result:**
- Previously generated QR code loads
- Same image and data as before
- No need to regenerate

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 2. Doctor QR Code Scanning Test

### Test Case 2.1: Scan Valid QR Code

**Steps:**
1. Login as doctor
2. Navigate to "QR Scanner" tab
3. Use any QR scanner app to scan the generated student QR code
4. Copy the decoded JSON data
5. Paste into the textarea in the QR Scanner
6. Click "Scan QR Code" button

**Expected Result:**
- Loading spinner appears during scan
- Patient information displays:
  - Name: [Student Name]
  - Student ID: [ID]
  - Email: [Email]
  - Phone: [Phone]
  - Branch: [Branch]
  - Year: [Year]
- "Medical Records" section appears with list of records
- "Medical Leaves" section appears (if any)
- "Diet Recommendations" section appears (if any)

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 2.2: View Medical Records from Scan

**Steps:**
1. Complete Test 2.1 (scan QR code)
2. Look at Medical Records section
3. Click to expand any record

**Expected Result:**
- Each medical record shows:
  - Symptoms (comma-separated list)
  - Severity badge (red/orange/green)
  - Doctor notes
  - Prescription (if written)
  - Date of consultation
- Records are sorted newest first
- Maximum 20 records displayed

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 2.3: Invalid QR Code Handling

**Steps:**
1. Login as doctor
2. Go to QR Scanner tab
3. Paste invalid JSON: `{"invalid": "data"}`
4. Click "Scan QR Code"

**Expected Result:**
- Error message appears: "Invalid QR code data"
- No patient data is displayed
- Input field remains focused for correction
- Error box is visible (red background)

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 2.4: Non-Existent Student

**Steps:**
1. Create a fake QR code JSON with non-existent userId:
   ```json
   {
     "userId": "000000000000000000000000",
     "studentId": "FAKE001",
     "token": "random-token",
     "generatedAt": "2024-12-27T00:00:00Z"
   }
   ```
2. Paste in QR Scanner
3. Click "Scan QR Code"

**Expected Result:**
- Error message appears: "Student not found"
- No patient data displayed

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 3. Access Control Tests

### Test Case 3.1: Student Cannot Scan QR Code

**Steps:**
1. Login as student
2. Try to access `/api/patient/scan-qr` endpoint via curl or API client
3. Send valid QR data

**Expected Result:**
- 403 Forbidden error
- Message: "Only doctors can scan QR codes"
- No medical data returned

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 3.2: Non-Authenticated User

**Steps:**
1. Do NOT login
2. Try to access generate-qr endpoint via curl without token

**Expected Result:**
- 401 Unauthorized error
- Request is rejected

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 3.3: Doctor Cannot Generate QR Code

**Steps:**
1. Login as doctor
2. Try to access `/api/patient/generate-qr` endpoint
3. Send POST request

**Expected Result:**
- 403 Forbidden error
- Message: "Only students can generate QR codes"

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 4. UI/UX Tests

### Test Case 4.1: Mobile Responsiveness - Student

**Steps:**
1. Login as student on mobile device or browser mobile view
2. Navigate to "My QR Code"
3. Check QR code display
4. Check information cards
5. Check download button

**Expected Result:**
- QR code is fully visible
- Information cards stack vertically
- Download button is easily tappable
- No horizontal scroll needed
- Text is readable

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 4.2: Mobile Responsiveness - Doctor

**Steps:**
1. Login as doctor on mobile device
2. Navigate to "QR Scanner"
3. Try to input QR data
4. Click scan button

**Expected Result:**
- Textarea is fully visible
- Button is easily tappable
- Results scroll vertically (if multiple sections)
- Mobile-friendly layout

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 4.3: Loading States

**Steps:**
1. Start generating QR code
2. Observe loading state
3. Start scanning QR code
4. Observe loading state

**Expected Result:**
- Loading spinner appears
- Button is disabled during loading
- "Generating..." or "Scanning..." text is shown
- Spinner animates smoothly

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 5. Data Accuracy Tests

### Test Case 5.1: QR Code Contains Correct Data

**Steps:**
1. Generate QR code as student
2. Scan the QR code with an online QR decoder
3. Verify the JSON content

**Expected Result:**
- QR code contains valid JSON
- JSON has fields: userId, studentId, token, generatedAt
- userId is a valid MongoDB ObjectId
- studentId matches the student's ID
- token is a valid UUID
- generatedAt is valid ISO timestamp

**Actual Result:** ✅ PASS (or FAIL with details)

Example output:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "studentId": "STU001",
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "generatedAt": "2024-12-27T10:30:00.000Z"
}
```

---

### Test Case 5.2: Scanned Data Accuracy

**Steps:**
1. Scan QR code as doctor
2. Verify returned student information matches actual student data
3. Verify medical records are correct
4. Verify dates are accurate

**Expected Result:**
- All student information is accurate
- Medical records match database
- No data is missing or corrupted
- Dates are formatted correctly

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 6. Error Recovery Tests

### Test Case 6.1: Network Error During QR Generation

**Steps:**
1. Turn off internet connection
2. Try to generate QR code
3. Restore internet

**Expected Result:**
- Error message appears
- User can retry after reconnecting
- Application doesn't crash

**Actual Result:** ✅ PASS (or FAIL with details)

---

### Test Case 6.2: Invalid Input Handling

**Steps:**
1. Paste random text in QR Scanner: "hello world"
2. Click "Scan QR Code"

**Expected Result:**
- Error message: "Invalid QR code data"
- Application handles error gracefully
- No console errors

**Actual Result:** ✅ PASS (or FAIL with details)

---

## 7. Performance Tests

### Test Case 7.1: QR Code Generation Speed

**Steps:**
1. Time the QR code generation process
2. Note the total time from click to display

**Expected Result:**
- Generation completes in <1 second
- UI remains responsive

**Actual Result:** ⏱️ Time: _____ ms

---

### Test Case 7.2: QR Code Scanning Speed

**Steps:**
1. Time the QR code scanning process
2. Note time from paste to data display

**Expected Result:**
- Scanning completes in <2 seconds
- Medical records load within 3 seconds

**Actual Result:** ⏱️ Time: _____ ms

---

## 8. Browser Compatibility Tests

### Test Case 8.1: Chrome
- [ ] QR generation works
- [ ] QR scanning works
- [ ] Download works
- [ ] UI renders correctly

### Test Case 8.2: Firefox
- [ ] QR generation works
- [ ] QR scanning works
- [ ] Download works
- [ ] UI renders correctly

### Test Case 8.3: Safari
- [ ] QR generation works
- [ ] QR scanning works
- [ ] Download works
- [ ] UI renders correctly

### Test Case 8.4: Edge
- [ ] QR generation works
- [ ] QR scanning works
- [ ] Download works
- [ ] UI renders correctly

---

## API Testing with Curl

### Test: Generate QR Code
```bash
curl -X POST http://localhost:5000/api/patient/generate-qr \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test: Get QR Code
```bash
curl -X GET http://localhost:5000/api/patient/my-qr \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Test: Scan QR Code
```bash
curl -X POST http://localhost:5000/api/patient/scan-qr \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "{\"userId\":\"...\",\"studentId\":\"...\",\"token\":\"...\",\"generatedAt\":\"...\"}"
  }'
```

---

## Summary Checklist

### Core Functionality
- [ ] Student QR generation works
- [ ] Doctor QR scanning works
- [ ] Patient data retrieval works
- [ ] Error handling works
- [ ] Role-based access works

### UI/UX
- [ ] Student UI is intuitive
- [ ] Doctor UI is intuitive
- [ ] Mobile responsive
- [ ] Loading states visible
- [ ] Error messages clear

### Performance
- [ ] QR generation <1s
- [ ] QR scanning <2s
- [ ] No lagging
- [ ] No crashes

### Security
- [ ] JWT auth required
- [ ] Role verification works
- [ ] Unauthorized access blocked
- [ ] Data is secure

### Browser Support
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

---

## Notes for Testing

1. **Use Real Data**: Test with actual student and doctor accounts
2. **Test Edge Cases**: Empty data, null values, special characters
3. **Monitor Console**: Check browser console for any errors
4. **Check Network**: Verify API calls in Network tab
5. **Mobile Testing**: Test on actual mobile devices, not just browser resize

---

## Known Issues & Solutions

### Issue: QR Code takes too long to generate
**Solution**: Check if backend is running properly, restart if needed

### Issue: Cannot scan QR code
**Solution**: Ensure you're using a valid QR scanner app, check if student has generated code

### Issue: Medical records not showing
**Solution**: Student may not have consultation records yet, check database

---

## Conclusion

All test cases should be run before deploying to production. Document results and any issues found.
