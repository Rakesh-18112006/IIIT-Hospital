# AI-Powered Prescription System - Integration Guide

## Overview

This comprehensive guide explains how to integrate the AI-powered prescription system with your hospital management application. The system includes:

- **Doctor Prescription Interface**: TAB-based medicine autocomplete, AI suggestions, pharmacy availability
- **Student Appointment Queue**: AI-powered risk assessment and appointment prioritization
- **Email Templates**: Professional appointment and prescription notifications
- **Medicine Tracking**: Store medicines and timings in MongoDB for compliance tracking

---

## 📋 Components Created

### Frontend Components

1. **`frontend/src/components/Prescription.jsx`**
   - Doctor prescription interface
   - Medicine autocomplete with TAB key expansion
   - Pharmacy availability indicator (Available/Low Stock/Unavailable)
   - AI-powered dosage suggestions
   - Medicine interaction warnings
   - Printable prescription format
   - Preview and save functionality

2. **`frontend/src/components/AppointmentQueue.jsx`**
   - Student appointment queue display
   - AI-powered risk assessment badges
   - Automatic appointment prioritization
   - Risk level: Critical > High > Medium > Low
   - Queue position tracking
   - Appointment status display

3. **`frontend/src/components/GroqApiConfig.jsx`**
   - Groq API key configuration modal
   - Test connection functionality
   - Status indicator
   - Feature information display

### Utilities

1. **`frontend/src/utils/groqService.js`**
   - Groq LLM API integration
   - Medicine suggestions with keywords (e.g., "para" → "Paracetamol")
   - Patient risk assessment
   - Drug interaction checking
   - Appointment prioritization
   - Email template generation
   - Medical advice generation

2. **`frontend/src/utils/emailTemplates.js`**
   - Professional appointment confirmation emails
   - Prescription receipt emails with medicine details
   - HTML/CSS styling
   - Hospital branding placeholders

### Backend Models

1. **`backend/models/Prescription.js`**
   - Stores prescription details
   - Medicine timings (morning 7:00 AM, noon, evening, night)
   - Medicine compliance tracking
   - Drug interaction warnings
   - Revision history
   - Email notification tracking

### Backend Controllers & Routes

1. **`backend/controllers/prescriptionController.js`**
   - Save prescription with medicine timings
   - Get patient prescriptions
   - Get medicine timings for reminders
   - Update medicine compliance
   - Download prescription PDF
   - Medicine schedule management

2. **`backend/routes/prescriptionRoutes.js`**
   - POST `/api/prescriptions/save` - Save prescription
   - GET `/api/prescriptions/my-prescriptions` - Get patient prescriptions
   - GET `/api/prescriptions/:id` - Get prescription details
   - GET `/api/prescriptions/patient/:patientId/medicine-timings` - Get medicine timings
   - POST `/api/prescriptions/:id/update-compliance` - Mark medicine as taken/skipped
   - GET `/api/prescriptions/:id/medicine-schedule` - Get medicine schedule
   - GET `/api/prescriptions/:id/download-pdf` - Download as PDF

---

## 🚀 Integration Steps

### Step 1: Get Groq API Key

1. Visit [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (format: `gsk_...`)

### Step 2: Update DoctorDashboard.jsx

Add the Prescription component to the Doctor Dashboard:

```jsx
import Prescription from "../components/Prescription.jsx";

// In your JSX:
<Prescription
  appointment={selectedAppointment}
  patientData={patientDetails}
  onSave={handleSavePrescription}
  doctorName={user.name}
  doctorDepartment={user.department}
  hospitalName="IIIT Hospital"
/>
```

### Step 3: Update StudentDashboard.jsx

Add the AppointmentQueue component and Groq config modal:

```jsx
import AppointmentQueue from "../components/AppointmentQueue.jsx";
import GroqApiConfig from "../components/GroqApiConfig.jsx";

// In your JSX:
<AppointmentQueue
  appointments={appointmentQueue}
  loading={appointmentQueueLoading}
  onRefresh={fetchAppointmentQueue}
  userEmail={user.email}
/>

{showGroqConfig && (
  <GroqApiConfig onClose={() => setShowGroqConfig(false)} />
)}
```

### Step 4: Update Navbar/Sidebar

Add Groq API configuration button:

```jsx
<button
  onClick={() => setShowGroqConfig(true)}
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
>
  <Zap className="w-4 h-4" />
  Configure AI
</button>
```

### Step 5: Update Appointment Controller (Optional Enhancement)

Modify the `handleUpdateAppointmentStatus` in `DoctorDashboard.jsx`:

```javascript
const handleUpdateAppointmentStatus = async (appointmentId, status) => {
  setStatusUpdateLoading(true);
  try {
    const prescriptionData = status === "completed" ? {
      appointmentId: selectedAppointment._id,
      diagnosis: diagnosis,
      symptoms: selectedAppointment.symptoms,
      medicines: medicines,
      notes: notes,
      advice: advice,
    } : {};

    if (status === "completed" && medicines.length > 0) {
      // Save prescription
      await api.post("/prescriptions/save", prescriptionData);
    }

    await api.put(`/appointments/doctor/${appointmentId}/status`, { status });
    fetchAppointmentQueue();
  } catch (error) {
    console.error("Error updating appointment status:", error);
    alert(error.response?.data?.message || "Failed to update status");
  } finally {
    setStatusUpdateLoading(false);
  }
};
```

### Step 6: Install Backend Dependencies (If Needed)

```bash
cd backend
npm install mongoose  # If not already installed
```

### Step 7: Update package.json in Backend

Ensure these dependencies exist:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.3",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5"
  }
}
```

---

## 💾 Database Structure

### Prescription Model Fields

```javascript
{
  appointmentId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  diagnosis: String,
  symptoms: [String],
  medicines: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
      timings: ["morning", "noon", "evening", "night"],
      specificTimes: ["07:00", "13:00", "18:00", "22:00"],
      medicineSchedule: [
        {
          date: Date,
          time: String,
          taken: Boolean,
          notes: String
        }
      ]
    }
  ],
  notes: String,
  advice: String,
  doctor: {
    name: String,
    department: String
  },
  hospital: {
    name: String,
    address: String
  },
  status: "active" | "completed" | "cancelled" | "revised",
  interactions: [
    {
      description: String,
      severity: "low" | "medium" | "high" | "critical"
    }
  ],
  emailSent: Boolean,
  emailSentAt: Date,
  compliance: {
    medicinesTaken: Number,
    medicinesSkipped: Number,
    lastUpdated: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔑 Features Breakdown

### 1. Medicine Autocomplete (TAB Key)

**How it works:**
1. Doctor types "par"
2. Suggestions appear: "Paracetamol 650mg", "Paracetamol 500mg"
3. Doctor presses TAB
4. First suggestion auto-completes with dosage and frequency
5. Specific times appear (morning, noon, evening, night)

**Backend:** Groq LLM suggests medicines based on keywords

### 2. Pharmacy Availability

**Status Indicators:**
- 🟢 **Available** - Medicine in stock
- 🟠 **Low Stock** - Limited availability
- 🔴 **Unavailable** - Out of stock
- ❓ **Unknown** - Not in database

**Suggested Alternatives:** If unavailable, system suggests equivalent alternatives (same salt)

### 3. Patient Risk Assessment

**Risk Levels:**
1. 🔴 **Critical** - Urgent intervention needed
2. 🟠 **High** - Priority appointment
3. 🟡 **Medium** - Normal appointment
4. 🟢 **Low** - Routine checkup

**Uses:**
- Groq LLM analyzes symptoms + medical history
- Risk score: 0-100
- Automatic appointment queue prioritization
- Displayed in appointment list

### 4. Medicine Timings Storage

**Format in MongoDB:**
```json
{
  "medicines": [
    {
      "name": "Paracetamol 650mg",
      "dosage": "1 tablet",
      "frequency": "3 times daily",
      "duration": "5 days",
      "timings": ["morning", "evening", "night"],
      "specificTimes": ["07:00", "18:00", "22:00"],
      "medicineSchedule": [
        {
          "date": "2025-01-15",
          "time": "07:00 AM",
          "taken": true,
          "notes": ""
        }
      ]
    }
  ]
}
```

**Access:**
- `/api/prescriptions/patient/:patientId/medicine-timings` - Get all current medicines
- `/api/prescriptions/:id/medicine-schedule` - Get specific prescription schedule
- `/api/prescriptions/:id/update-compliance` - Record medicine taken/skipped

### 5. Email Notifications

**Appointment Confirmation Email:**
- Sent when appointment is booked
- Contains: doctor name, date, time, symptoms, instructions
- Professional HTML template with hospital branding

**Prescription Receipt Email:**
- Sent when prescription is issued
- Contains: diagnosis, medicines with dosages, doctor's advice
- Medicine table with timing information
- Download link for PDF

---

## 🎯 Workflow Example

### Doctor's Perspective

1. Doctor opens appointment in queue
2. Clicks "Write Prescription" button
3. Enters diagnosis (e.g., "Upper Respiratory Infection")
4. Types medicine keyword "amox" → TAB key → Auto-completes to "Amoxicillin 500mg"
5. Enters frequency "3 times daily" and duration "7 days"
6. Selects timing: Morning (7:00 AM), Evening (6:00 PM)
7. Adds dosage and instructions
8. Adds more medicines similarly
9. Checks for interactions (AI alerts if found)
10. Enters doctor's notes and patient advice
11. Clicks "Save Prescription"
12. System generates email and sends to patient

### Student's Perspective

1. Student logs in and views "My Appointments"
2. Sees appointments prioritized by risk level
3. Critical appointments appear at top
4. Each appointment shows:
   - Risk level with score
   - Doctor name and department
   - Symptoms/chief complaints
   - Queue position
   - Appointment status
5. Once appointment is completed:
   - Receives prescription email
   - Can view medicine timings
   - Can mark medicines as taken for compliance tracking

---

## 🔧 Configuration

### Environment Variables (Backend)

Add to `.env`:

```
GROQ_API_KEY=gsk_...  # Optional: can also be set from frontend
MONGODB_URI=mongodb://localhost:27017/hospital
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_key
```

### Frontend Configuration

The Groq API key is stored in browser localStorage:
- Ask user to configure in sidebar
- Key is sent with each API request
- No need to expose key in .env files

### CORS Settings

Already configured in `server.js`. Verify:

```javascript
app.use(cors()); // Allows frontend requests
```

---

## 📧 Email Service Integration

The system expects `emailService.js` to handle sending emails. Update if needed:

```javascript
// backend/utils/emailService.js
export const sendEmail = async (emailData) => {
  const { to, subject, prescription } = emailData;
  
  // Use your email provider (Gmail, SendGrid, etc.)
  // Example with nodemailer:
  const transporter = nodemailer.createTransport({...});
  
  const htmlContent = generatePrescriptionReceiptEmail(prescription);
  
  await transporter.sendMail({
    from: "hospital@example.com",
    to: to,
    subject: subject,
    html: htmlContent
  });
};
```

---

## 🧪 Testing

### Test Medicine Autocomplete

1. Go to Doctor Dashboard
2. Open prescription interface
3. Type "par" in medicine field
4. Press TAB
5. Should auto-complete to "Paracetamol 500mg" with dosage

### Test Risk Assessment

1. Go to Student Dashboard
2. View appointments
3. AI will assess and prioritize by risk
4. Critical appointments appear first

### Test Prescription Email

1. Doctor saves prescription
2. Check patient's email
3. Should receive professional email with medicine details

---

## 🚨 Troubleshooting

### "Groq API Key Not Configured"

**Solution:** 
1. Click "Configure AI" in sidebar
2. Enter Groq API key from [console.groq.com/keys](https://console.groq.com/keys)
3. Click "Test Connection"
4. Click "Save API Key"

### Medicine Suggestions Not Appearing

**Possible causes:**
- Groq API key not configured
- Network error connecting to Groq API
- Keyword too short (minimum 2 characters)

**Solution:** Check browser console for error messages

### Prescription Not Saving

**Possible causes:**
- No medicines added
- Network error
- Backend route not registered

**Solution:** Check browser network tab and server logs

---

## 📱 Responsive Design

All components are responsive and work on:
- Desktop (1920px, 1440px, 1024px)
- Tablet (768px, 834px)
- Mobile (375px, 414px)

---

## 🔐 Security Considerations

1. **API Key Storage:** Frontend stores Groq key in localStorage (user's device)
   - Not sent to backend
   - Not visible in network requests to hospital server
   - User responsible for key security

2. **Authorization:** All prescription endpoints protected by:
   - JWT token validation
   - Role-based access control
   - Patient can only see own prescriptions

3. **Data Privacy:** Prescription data includes sensitive medical information
   - Encrypted during transmission (HTTPS)
   - Access restricted by role and ownership

---

## 📈 Future Enhancements

1. **PDF Generation:** Use pdfkit or html2pdf for downloadable prescriptions
2. **Medicine Reminders:** Push notifications when medicine is due
3. **Pharmacy Integration:** Real-time inventory from hospital pharmacy
4. **Drug Interactions:** More comprehensive database with FDA data
5. **Prescription History:** Charts showing medicine compliance over time
6. **Mobile App:** Native iOS/Android app for students
7. **Video Consultation:** Integration with video call API
8. **Prescription Refills:** One-click medicine refill requests

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Review server logs for API errors
3. Test Groq API connection separately
4. Verify MongoDB connection and Prescription model

---

## ✅ Checklist

- [ ] Groq API key obtained
- [ ] Frontend components created
- [ ] Backend models and controllers created
- [ ] Routes registered in server.js
- [ ] Database connection verified
- [ ] Email service configured
- [ ] DoctorDashboard updated with Prescription component
- [ ] StudentDashboard updated with AppointmentQueue component
- [ ] Groq API configuration added to sidebar
- [ ] Tested medicine autocomplete
- [ ] Tested risk assessment
- [ ] Tested prescription email
- [ ] All responsive design verified

---

**Last Updated:** December 28, 2025
**System:** IIIT Hospital Management
**Version:** 1.0.0
