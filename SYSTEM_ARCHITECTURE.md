# 🏥 AI Prescription System - Architecture & Data Flow

## 📋 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Doctor Dashboard          │         Student Dashboard           │
│  ├─ Prescription.jsx       │         ├─ AppointmentQueue.jsx    │
│  │  ├─ Medicine form       │         │  ├─ Risk assessment      │
│  │  ├─ Autocomplete        │         │  ├─ Priority sorting     │
│  │  ├─ AI suggestions      │         │  └─ Status display       │
│  │  ├─ Pharmacy status     │         │                           │
│  │  └─ Save & Print        │         └─ GroqApiConfig.jsx       │
│  │                          │            └─ API key setup       │
│  └─ Groq API Service       │                                    │
│     ├─ Medicine autocomplete│    Utilities                      │
│     ├─ Risk assessment      │    ├─ groqService.js             │
│     ├─ Drug interactions    │    │  └─ Groq LLM calls         │
│     └─ AI suggestions       │    └─ emailTemplates.js          │
│                             │       └─ HTML email formats      │
└─────────────────────────────────────────────────────────────────┘
                                    ↓ API Calls (HTTP/JSON)
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Express.js)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routes                    Controllers          Middleware      │
│  ├─ /prescriptions/save    └─ prescriptionController.js        │
│  ├─ /prescriptions/:id        ├─ savePrescription()            │
│  ├─ /prescriptions/my/*       ├─ getPrescription()             │
│  ├─ /patient/:id/medicine*    ├─ getMedicineTimings()          │
│  └─ /update-compliance        ├─ updateCompliance()            │
│                               └─ downloadPDF()                 │
│                                                                   │
│  Auth Middleware (protect, authorize)                           │
│  └─ Validates JWT token and user role                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                    ↓ Database Queries
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (MongoDB)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections                                                     │
│  ├─ Users (doctors, students, admins)                           │
│  │  └─ notifications array                                      │
│  │                                                               │
│  ├─ Prescriptions (NEW!)                                        │
│  │  ├─ appointmentId (ref)                                      │
│  │  ├─ patientId (ref)                                          │
│  │  ├─ doctorId (ref)                                           │
│  │  ├─ diagnosis: String                                        │
│  │  ├─ medicines: [                                             │
│  │  │  ├─ name                                                  │
│  │  │  ├─ dosage                                                │
│  │  │  ├─ frequency                                             │
│  │  │  ├─ duration                                              │
│  │  │  ├─ timings: ["morning", "evening", "night"]             │
│  │  │  ├─ specificTimes: ["07:00", "18:00", "22:00"]          │
│  │  │  └─ medicineSchedule: [                                  │
│  │  │     ├─ date                                               │
│  │  │     ├─ time                                               │
│  │  │     ├─ taken: Boolean                                     │
│  │  │     └─ notes                                              │
│  │  │  ]                                                        │
│  │  ├─ notes                                                    │
│  │  ├─ advice                                                   │
│  │  ├─ emailSent: Boolean                                       │
│  │  ├─ compliance tracking                                      │
│  │  └─ interactions: []                                         │
│  │                                                               │
│  ├─ Appointments                                                │
│  │  ├─ status (pending, in-progress, completed)                │
│  │  ├─ prescription (ref)                                       │
│  │  ├─ severity (critical, high, medium, low)                  │
│  │  └─ symptoms: []                                             │
│  │                                                               │
│  └─ Medical Documents                                           │
│     └─ Stores patient medical records                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                    ↓ API Calls
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES (AI)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Groq API (https://api.groq.com)                               │
│  └─ Model: llama-3.3-70b-versatile                             │
│     ├─ Medicine autocomplete                                    │
│     ├─ Dosage suggestions                                       │
│     ├─ Risk assessment                                          │
│     ├─ Drug interactions                                        │
│     ├─ Appointment prioritization                               │
│     └─ Medical advice generation                                │
│                                                                   │
│  Email Service (SMTP/SendGrid)                                 │
│  ├─ Appointment confirmation emails                            │
│  └─ Prescription receipt emails                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1️⃣ Doctor Writing Prescription

```
Doctor Opens Appointment
        ↓
User sees Prescription Component
        ↓
Doctor types medicine keyword "par"
        ↓
Frontend calls groqService.getMedicineSuggestions("par")
        ↓
Groq API returns suggestions:
  [
    { fullName: "Paracetamol 650mg", dosage: "1 tablet", ... },
    { fullName: "Paracetamol 500mg", dosage: "1 tablet", ... }
  ]
        ↓
Suggestions appear as dropdown
        ↓
Doctor presses TAB
        ↓
First suggestion auto-completes
        ↓
Doctor selects timings (morning, evening, night)
        ↓
Doctor adds more medicines (repeat)
        ↓
Doctor enters diagnosis, notes, advice
        ↓
Doctor clicks "Save Prescription"
        ↓
Frontend validates & sends to /api/prescriptions/save
        ↓
Backend Controller savePrescription():
  ├─ Create Prescription document
  ├─ Store medicines with timings
  ├─ Check for interactions
  ├─ Send email to patient
  ├─ Add notification to patient
  └─ Save to MongoDB
        ↓
Response: {status: 201, prescription: {...}, emailSent: true}
        ↓
Frontend shows success message
        ↓
Patient receives email with:
  - Diagnosis
  - Medicine table with dosages
  - Timings (Morning 7:00 AM, Evening 6:00 PM, etc.)
  - Doctor's advice
```

### 2️⃣ Student Viewing Appointments (Risk Assessment)

```
Student Logs In
        ↓
Student clicks "My Appointments"
        ↓
Frontend fetches appointments via /api/appointments
        ↓
AppointmentQueue component loads
        ↓
Component checks if Groq API is configured
        ↓
For each appointment, call groqService.assessPatientRisk():
  - Input: symptoms, medical history, vitals
  - Groq LLM analyzes
  - Returns: riskLevel (critical/high/medium/low), riskScore (0-100)
        ↓
Results:
  Appointment 1: Fever + Cough → HIGH (75/100)
  Appointment 2: Regular checkup → LOW (15/100)
  Appointment 3: Chest pain + Shortness of breath → CRITICAL (95/100)
        ↓
Sort appointments by risk (CRITICAL > HIGH > MEDIUM > LOW)
        ↓
Display in order:
  #1 🔴 CRITICAL - Chest pain (Dr. Sharma)
  #2 🟠 HIGH - Fever, Cough (Dr. Patel)
  #3 🟢 LOW - Regular checkup (Dr. Kumar)
        ↓
Each appointment card shows:
  - Risk badge with score
  - Doctor name & department
  - Symptoms listed
  - Queue position
  - Appointment status
  - Risk assessment reason
        ↓
Click "View Details" to see full appointment info
        ↓
If prescription available, show medicine timings
```

### 3️⃣ Medicine Timings Storage & Retrieval

```
Prescription Saved
        ↓
Medicines array in MongoDB:
{
  name: "Paracetamol 650mg",
  dosage: "1 tablet",
  frequency: "3 times daily",
  duration: "5 days",
  timings: ["morning", "evening", "night"],
  specificTimes: ["07:00", "18:00", "22:00"],
  medicineSchedule: [
    { date: "2025-01-15", time: "07:00 AM", taken: true, ... },
    { date: "2025-01-15", time: "18:00 PM", taken: false, ... },
    ...
  ]
}
        ↓
Patient requests GET /api/prescriptions/patient/:id/medicine-timings
        ↓
Backend returns all active prescriptions with medicines:
{
  allMedicines: [
    { medicineName: "Paracetamol", timings: ["morning", "evening"], ... },
    { medicineName: "Cetirizine", timings: ["night"], ... }
  ],
  medicinesByTiming: {
    morning: [Paracetamol, Ibuprofen],
    evening: [Paracetamol, Aspirin],
    night: [Cetirizine, Melatonin]
  }
}
        ↓
Student can:
  1. View all medicines organized by timing
  2. Mark medicine as taken
  3. Add notes (side effects, skipped reason)
  4. See compliance percentage
        ↓
Each time marked as taken:
POST /api/prescriptions/:id/update-compliance
{
  medicineIndex: 0,
  taken: true,
  notes: "Took with water after breakfast"
}
        ↓
Backend updates medicineSchedule array
Updates compliance tracking:
  {
    medicinesTaken: 15,
    medicinesSkipped: 2,
    lastUpdated: "2025-01-15"
  }
```

### 4️⃣ Email Generation Flow

```
Prescription saved
        ↓
Call generatePrescriptionReceiptEmail(prescriptionData)
        ↓
emailTemplates.js creates HTML:
  - Hospital header with logo
  - Patient info (name, ID, age)
  - Doctor info (name, department)
  - Diagnosis section
  - Medicine table (name, dosage, frequency, duration)
  - Doctor's advice
  - Follow-up instructions
  - Hospital contact info
        ↓
HTML email template:
  <table>
    <tr>
      <th>Medicine</th>
      <th>Dosage</th>
      <th>Frequency</th>
      <th>Duration</th>
    </tr>
    <tr>
      <td>Paracetamol 650mg</td>
      <td>1 tablet</td>
      <td>3 times daily</td>
      <td>5 days</td>
    </tr>
  </table>
        ↓
emailService.js sends via SMTP/SendGrid:
  to: patient@email.com
  subject: Medical Prescription from Dr. [Name]
  body: HTML template
        ↓
Patient receives professional email
        ↓
Patient can:
  - View on mobile/desktop
  - Forward to pharmacy
  - Print for records
  - Show doctor later if needed
```

---

## 🗄️ Database Schema Details

### Prescription Collection

```javascript
{
  _id: ObjectId,
  appointmentId: ObjectId,        // Ref to Appointment
  patientId: ObjectId,            // Ref to User (student)
  doctorId: ObjectId,             // Ref to User (doctor)
  
  diagnosis: "Upper Respiratory Infection",
  symptoms: ["fever", "cough", "sore throat"],
  
  medicines: [
    {
      name: "Paracetamol 650mg",
      dosage: "1 tablet",
      frequency: "3 times daily",
      duration: "5 days",
      instructions: "After meals with water",
      timings: ["morning", "noon", "evening"],
      specificTimes: ["07:00", "13:00", "18:00"],
      medicineSchedule: [
        {
          date: ISODate("2025-01-15"),
          time: "07:00 AM",
          taken: true,
          notes: "Took with breakfast"
        },
        {
          date: ISODate("2025-01-15"),
          time: "13:00 PM",
          taken: false,
          notes: "Forgot due to busy schedule"
        }
      ]
    },
    // ... more medicines
  ],
  
  notes: "Patient has good immunity, quick recovery expected",
  advice: "Rest, drink warm water, avoid cold food for 7 days",
  
  interactions: [
    {
      description: "Paracetamol + Aspirin may cause stomach upset",
      severity: "medium"
    }
  ],
  
  hospital: {
    name: "IIIT Hospital",
    address: "RGUKT Campus, Telangana",
    phone: "+91-XXXXXXXXXX"
  },
  
  doctor: {
    name: "Dr. Sharma",
    department: "General Medicine",
    specialization: "Internal Medicine"
  },
  
  status: "active",                // active, completed, cancelled, revised
  emailSent: true,
  emailSentAt: ISODate("2025-01-15T14:30:00Z"),
  
  compliance: {
    medicinesTaken: 12,
    medicinesSkipped: 3,
    lastUpdated: ISODate("2025-01-15T18:00:00Z")
  },
  
  revisions: [],
  
  createdAt: ISODate("2025-01-15T10:00:00Z"),
  updatedAt: ISODate("2025-01-15T18:00:00Z")
}
```

---

## 🔌 API Endpoints Summary

```
Doctor Routes:
POST   /api/prescriptions/save
       Send: { appointmentId, diagnosis, medicines, notes, advice }
       Response: { prescription, emailSent }

Patient Routes:
GET    /api/prescriptions/my-prescriptions
       Response: [prescriptions...]

GET    /api/prescriptions/:id
       Response: { prescription with all details }

GET    /api/prescriptions/patient/:patientId/medicine-timings
       Response: { allMedicines, medicinesByTiming, totalActive }

GET    /api/prescriptions/:id/medicine-schedule
       Response: [ { medicineName, dosage, nextDueTime, compliance } ]

POST   /api/prescriptions/:id/update-compliance
       Send: { medicineIndex, taken, notes }
       Response: { compliance tracking data }

GET    /api/prescriptions/:id/download-pdf
       Response: PDF document
```

---

## 🔐 Security & Authorization

```
JWT Token → Middleware (protect)
           ↓
       Route-level Auth (authorize)
           ↓
     Doctor: can save prescriptions
     Student: can view own prescriptions & medicine timings
     Admin: can view all
           ↓
    Field-level Access Control
           ↓
    Patient sees: diagnosis, medicines, doctor's advice
    Doctor sees: all patient prescription details
    Admin sees: everything for auditing
```

---

## 📊 Component Interaction Map

```
DoctorDashboard
├─ Appointment List
│  └─ Click appointment
│     ↓
│     Shows Prescription Component
│     ├─ groqService.js
│     │  ├─ getMedicineSuggestions()
│     │  ├─ checkMedicineInteractions()
│     │  └─ generateMedicalAdvice()
│     │
│     └─ onSave → /api/prescriptions/save
│        ↓
│        ✉️ Email sent to patient
│        ✓ Prescription stored in DB

StudentDashboard
├─ Appointment Queue
│  ├─ AppointmentQueue Component
│  │  ├─ groqService.js
│  │  │  └─ assessPatientRisk()
│  │  │
│  │  └─ Display appointments sorted by risk
│  │
│  └─ Configure AI Button
│     ↓
│     Opens GroqApiConfig Modal
│     ├─ Input: Groq API key
│     ├─ Test: Connection check
│     └─ Save: localStorage
```

---

## ✅ Implementation Checklist

- [x] Frontend Components (3 files)
- [x] Backend Models (Prescription.js)
- [x] Backend Controllers (prescriptionController.js)
- [x] Backend Routes (prescriptionRoutes.js)
- [x] Utility Services (groqService.js, emailTemplates.js)
- [x] Server configuration (server.js update)
- [x] Documentation (this file + guides)
- [ ] Frontend Integration (add to dashboards)
- [ ] Environment setup (Groq API key)
- [ ] Testing & deployment

---

**Version:** 1.0.0  
**Last Updated:** December 28, 2025  
**System:** IIIT Hospital - AI Prescription Management
