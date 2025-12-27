# QR Code Patient Identification System

## Overview

This feature implements a unique QR code system for student identification in the hospital management system. Doctors can scan student QR codes before writing prescriptions to instantly access complete medical histories and records.

## Features

### For Students
- **Generate QR Code**: Students can generate their unique QR code from their profile
- **QR Code Display**: The QR code is displayed in the student's profile with:
  - Visual QR code image
  - Student information (name, ID, email)
  - Download QR code as PNG image
  - Usage instructions
  - Security warnings

### For Doctors
- **QR Scanner Tab**: New "QR Scanner" tab in the doctor dashboard
- **Scan QR Codes**: Paste scanned QR data to instantly retrieve patient information
- **Complete Patient History**: View:
  - Student basic information (name, ID, email, phone, branch, year)
  - All medical records with symptoms, severity, and prescriptions
  - Medical leave history
  - Diet recommendations
  - Doctor notes and advice

## Technical Implementation

### Backend Changes

#### 1. **User Model** (`/backend/models/User.js`)
Added two new fields:
```javascript
qrCode: {
  type: String,
  unique: true,
  sparse: true,
},
qrCodeGenerated: {
  type: Boolean,
  default: false,
},
```

#### 2. **QR Code Utility** (`/backend/utils/qrCodeGenerator.js`)
New utility file with functions:
- `generateQRCode(userId, studentId)` - Generates unique QR code with user data
- `parseQRCode(qrData)` - Parses QR code data
- `generateQRCodeImage(qrData)` - Generates QR code as image buffer

#### 3. **Patient Controller** (`/backend/controllers/patientController.js`)
Added three new endpoints:
- `generateStudentQRCode` - Generates QR code for authenticated student
- `getStudentQRCode` - Retrieves student's existing QR code
- `scanQRCode` - Scans QR code and returns patient's complete medical history

#### 4. **Patient Routes** (`/backend/routes/patientRoutes.js`)
Added three new routes:
- `POST /patient/generate-qr` - Generate QR code (student only)
- `GET /patient/my-qr` - Get QR code (student only)
- `POST /patient/scan-qr` - Scan QR code (doctor only)

### Frontend Changes

#### 1. **Student Dashboard** (`/frontend/src/pages/StudentDashboard.jsx`)
- Added "My QR Code" tab to sidebar navigation
- New state management for QR code:
  - `qrCode` - Stores QR code data and image
  - `qrLoading` - Loading state
  - `qrGenerated` - Track if QR code has been generated
- New functions:
  - `fetchQRCode()` - Fetch existing QR code
  - `handleGenerateQRCode()` - Generate new QR code
  - `handleDownloadQRCode()` - Download QR code as PNG
- New UI section with:
  - Generate QR code button
  - QR code display
  - Download button
  - Student information display
  - Usage instructions
  - Security warnings

#### 2. **Doctor Dashboard** (`/frontend/src/pages/DoctorDashboard.jsx`)
- Added "QR Scanner" tab to sidebar navigation
- New state management for QR scanner:
  - `showQRScanner` - Modal visibility
  - `qrScannerLoading` - Loading state
  - `qrScanResult` - Stores scanned patient data
  - `qrScanError` - Error messages
- New function:
  - `handleQRCodeInput(qrData)` - Process scanned QR data
- New UI section with:
  - QR data input textarea
  - Scan button
  - Patient information display
  - Medical records list
  - Medical leaves list
  - Diet recommendations list

### Database Considerations

No schema changes required for existing collections. The `qrCode` field is added to the User model and is optional/nullable.

## API Endpoints

### Student Endpoints

#### Generate QR Code
```
POST /api/patient/generate-qr
Authorization: Bearer {token}
Role: student

Response:
{
  "message": "QR code generated successfully",
  "qrCodeImage": "data:image/png;base64,...",
  "qrData": "{\"userId\": \"...\", \"studentId\": \"...\", \"token\": \"...\", \"generatedAt\": \"...\"}"
}
```

#### Get QR Code
```
GET /api/patient/my-qr
Authorization: Bearer {token}
Role: student

Response:
{
  "qrCodeImage": "data:image/png;base64,...",
  "studentId": "...",
  "name": "...",
  "email": "...",
  "qrCodeGenerated": true
}
```

### Doctor Endpoints

#### Scan QR Code
```
POST /api/patient/scan-qr
Authorization: Bearer {token}
Role: doctor
Content-Type: application/json

Body:
{
  "qrData": "{\"userId\": \"...\", \"studentId\": \"...\", \"token\": \"...\", \"generatedAt\": \"...\"}"
}

Response:
{
  "message": "QR code scanned successfully",
  "student": {
    "id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "studentId": "...",
    "branch": "...",
    "year": ...,
    "hostelBlock": "...",
    "address": "..."
  },
  "medicalRecords": [...],
  "medicalLeaves": [...],
  "dietRecommendations": [...]
}
```

## QR Code Data Format

Each QR code contains a JSON object with the following structure:
```json
{
  "userId": "mongodb_user_id",
  "studentId": "student_id_number",
  "token": "unique_uuid_token",
  "generatedAt": "ISO_timestamp"
}
```

## Installation & Setup

### 1. Install Dependencies

Backend:
```bash
cd backend
npm install qrcode uuid
```

Frontend:
```bash
cd frontend
npm install qr-scanner
```

### 2. Update Database

The application will automatically add the new fields to existing users when they first generate their QR code.

### 3. Start Services

Backend:
```bash
npm run dev
```

Frontend:
```bash
npm run dev
```

## Usage Guide

### For Students

1. **Generate QR Code**:
   - Click "My QR Code" in the sidebar
   - Click "Generate QR Code" button
   - Wait for code to generate

2. **View QR Code**:
   - The QR code is displayed with your information
   - Read the usage instructions
   - Note the security warning

3. **Download QR Code**:
   - Click "Download QR Code" button
   - Keep the image safe and secure
   - Can share with trusted doctors only

### For Doctors

1. **Access QR Scanner**:
   - Click "QR Scanner" in the doctor dashboard sidebar

2. **Scan QR Code**:
   - Ask student to show their QR code (physical or digital)
   - Use a QR scanner/camera app to capture the code
   - Copy the decoded QR data

3. **View Patient Data**:
   - Paste the QR data into the textarea
   - Click "Scan QR Code" button
   - View complete patient information and history
   - Write prescription based on full medical history

## Security Considerations

1. **QR Code Contains**: Only user ID, student ID, and a unique token
2. **Access Control**: Only authenticated doctors can scan QR codes
3. **Data Protection**: Medical records are protected by doctor role authorization
4. **Token in QR**: A unique UUID is generated with each QR code for additional security
5. **Recommendation**: Students should only show their QR code to authorized medical professionals

## Error Handling

The system handles:
- Invalid QR data format
- Student not found
- QR code generation failures
- Scan failures
- Network errors

All errors provide user-friendly messages.

## Troubleshooting

### QR Code Not Generating
1. Check if user is logged in as a student
2. Verify internet connection
3. Check browser console for errors
4. Try refreshing the page

### QR Code Not Scanning
1. Ensure QR data is properly copied
2. Check if pasted data is valid JSON
3. Verify doctor is logged in with doctor role
4. Check if patient exists in database

### Medical Records Not Appearing
1. Student may not have any consultation records yet
2. Records may be in different status
3. Try refreshing the page

## Future Enhancements

1. **Real QR Scanner**: Implement camera-based QR scanning in the browser
2. **QR Code Expiration**: Add option to set expiration dates on QR codes
3. **Scan History**: Track who scanned which QR codes
4. **Revoke QR Codes**: Allow students to revoke/regenerate codes
5. **Multiple QR Codes**: Support multiple QR codes with different permissions
6. **Mobile App**: Create mobile app for easier scanning
7. **Voice Alerts**: Audio notification when QR code is scanned
8. **Audit Trail**: Complete audit trail of QR code access

## Package Details

### Backend Packages Added
- **qrcode** (v14.x): QR code generation library
- **uuid** (v9.x): Unique ID generation

### Frontend Packages Added
- **qr-scanner** (v2.x): QR code scanning library

## Performance Notes

- QR codes are generated on-demand (not pre-generated)
- QR images are returned as base64 data URLs
- Medical record queries are paginated (last 20 records)
- No additional database indexing required

## Support

For issues or feature requests related to the QR code system, please contact:
- Backend Team: Check server logs for errors
- Frontend Team: Check browser console for errors
- Database Team: Verify user and medical record data integrity
