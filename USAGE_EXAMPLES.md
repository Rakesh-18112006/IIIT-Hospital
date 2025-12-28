# 💊 AI Prescription System - Usage Examples & Walkthroughs

## 👨‍⚕️ Doctor's Workflow Example

### Scenario: Dr. Sharma treating a student with fever and cough

```
┌─────────────────────────────────────────────────────────────────┐
│  DOCTOR'S PRESCRIPTION INTERFACE                                │
└─────────────────────────────────────────────────────────────────┘

Patient: Raj Kumar (Roll No: CS21B001)
Age: 19, Gender: Male

[DIAGNOSIS FIELD]
Type: "Upper Respiratory Infection" ↓

[MEDICINE SECTION]
"Add Medicine"

Medicine Name: "amoxi"
┌─ Suggestions appear ─────────────────────┐
│ • Amoxicillin 500mg - 2 tablets per dose│
│ • Amoxicillin 250mg - 1 tablet per dose │
│ • Ampicillin 500mg - similar use        │
└─────────────────────────────────────────┘

Doctor presses TAB ↓

Auto-completes to: "Amoxicillin 500mg"

Dosage: "1 tablet" (auto-filled)
Frequency: "3 times daily" (auto-filled)
Duration: "7 days" (suggested)
Instructions: "After meals with water" (suggested)

Timing Selection:
┌──────────────────────────────────┐
│ ☐ Morning (7:00 AM)             │
│ ☑ Noon (1:00 PM)                │
│ ☑ Evening (6:00 PM)             │
│ ☑ Night (10:00 PM)              │
└──────────────────────────────────┘

Pharmacy Status:
🟢 AVAILABLE - In stock
  Alternatives: Azithromycin 500mg

[Add Medicine Button] ↓

─────────────────────────────────────

Medicine 1 ADDED: Amoxicillin 500mg
├─ Dosage: 1 tablet
├─ Frequency: 3 times daily
├─ Duration: 7 days
├─ Timings: 1:00 PM, 6:00 PM, 10:00 PM
└─ Status: 🟢 Available

─────────────────────────────────────

Doctor adds 2nd Medicine: "cetiri..." (Cetirizine)

Type: "cetiri" → TAB

Auto-complete: Cetirizine 10mg
Frequency: 1 time daily
Timing: Night only (10:00 PM)

─────────────────────────────────────

Medicine 2 ADDED: Cetirizine 10mg
├─ Dosage: 1 tablet
├─ Frequency: Once daily
├─ Duration: 5 days
├─ Timings: 10:00 PM
└─ Status: 🟢 Available

─────────────────────────────────────

⚠️ INTERACTION CHECK:
"Amoxicillin + Cetirizine: No major interactions"
✓ Safe combination

─────────────────────────────────────

[Doctor's Notes Field]
"Patient appears healthy, no complications. Good immunity.
Quick recovery expected in 7 days. Follow up if symptoms persist."

[Patient Advice Field]
"Rest for 5-7 days
Drink warm water with honey/turmeric
Avoid cold food and drinks
Take medicines on prescribed times
Seek immediate care if chest pain develops"

─────────────────────────────────────

Buttons:
[ Preview ]  [ Print ]  [ Save Prescription ✓ ]

Doctor clicks "Save" ↓

─────────────────────────────────────

✅ SUCCESS MESSAGE:
"Prescription saved successfully! Email sent to student."

─────────────────────────────────────

PRESCRIPTION SAVED TO DATABASE:
{
  appointmentId: "639f8d12abc123...",
  patientId: "639f8d12abc456...",
  doctorId: "639f8d12abc789...",
  
  diagnosis: "Upper Respiratory Infection",
  symptoms: ["fever", "cough", "sore throat"],
  
  medicines: [
    {
      name: "Amoxicillin 500mg",
      dosage: "1 tablet",
      frequency: "3 times daily",
      duration: "7 days",
      timings: ["noon", "evening", "night"],
      specificTimes: ["13:00", "18:00", "22:00"],
      medicineSchedule: [
        { date: "2025-01-15", time: "13:00", taken: false },
        { date: "2025-01-15", time: "18:00", taken: false },
        ...
      ]
    },
    {
      name: "Cetirizine 10mg",
      dosage: "1 tablet",
      frequency: "Once daily",
      duration: "5 days",
      timings: ["night"],
      specificTimes: ["22:00"],
      medicineSchedule: [
        { date: "2025-01-15", time: "22:00", taken: false },
        ...
      ]
    }
  ],
  
  notes: "Patient appears healthy, no complications...",
  advice: "Rest for 5-7 days...",
  
  emailSent: true,
  emailSentAt: "2025-01-15T14:35:22Z"
}

─────────────────────────────────────

EMAIL SENT TO PATIENT:
To: raj.kumar@student.com
Subject: Medical Prescription from Dr. Sharma

┌──────────────────────────────────┐
│        IIIT HOSPITAL             │
│     MEDICAL PRESCRIPTION         │
│                                  │
│ Dr. Sharma                       │
│ General Medicine                 │
│                                  │
│ Patient: Raj Kumar               │
│ Student ID: CS21B001             │
│ Date: January 15, 2025           │
├──────────────────────────────────┤
│ DIAGNOSIS: Upper Respiratory URI │
│                                  │
│ MEDICINES:                       │
│ ┌────────────────────────────┐   │
│ │ Medicine   │ Dosage │ Freq │   │
│ ├────────────────────────────┤   │
│ │ Amoxicillin│ 1 tab  │ TDS  │   │
│ │ 500mg      │        │      │   │
│ ├────────────────────────────┤   │
│ │ Cetirizine │ 1 tab  │ OD   │   │
│ │ 10mg       │        │      │   │
│ └────────────────────────────┘   │
│                                  │
│ DOCTOR'S ADVICE:                 │
│ Rest for 5-7 days, drink warm... │
│                                  │
│ Rx #: ABJK1572                   │
└──────────────────────────────────┘
```

---

## 👨‍🎓 Student's Workflow Example

### Scenario: Raj Kumar checking his appointments

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDENT APPOINTMENT QUEUE - WITH AI RISK ASSESSMENT            │
└─────────────────────────────────────────────────────────────────┘

APPOINTMENTS AUTOMATICALLY PRIORITIZED BY RISK:

┌───────────────────────────────────────────────────────────────┐
│ #1  🔴 CRITICAL - Risk Score: 92/100                         │
│                                                               │
│ Dr. Sharma - General Medicine                                │
│ 📅 January 16, 2025 at 2:30 PM                               │
│                                                               │
│ Chief Complaint: Chest pain, difficulty breathing             │
│ Status: [PENDING]  [CONFIRMED]                              │
│                                                               │
│ 🚨 RISK ASSESSMENT:                                           │
│ Chest pain + shortness of breath suggests possible cardiac    │
│ or respiratory emergency. Requires URGENT intervention.       │
│                                                               │
│ Recommendations:                                              │
│ • ECG (Electrocardiogram) needed                              │
│ • Oxygen saturation check                                     │
│ • Immediate doctor consultation                               │
│                                                               │
│ [ View Details ]  [ Resend Email ]                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ #2  🟠 HIGH - Risk Score: 75/100                             │
│                                                               │
│ Dr. Patel - General Medicine                                 │
│ 📅 January 15, 2025 at 3:00 PM                               │
│                                                               │
│ Chief Complaint: High fever, severe cough, sore throat        │
│ Status: [PENDING]  [IN-PROGRESS]                            │
│                                                               │
│ 🔥 RISK ASSESSMENT:                                           │
│ Fever (39.5°C) + severe cough with sore throat indicates      │
│ likely viral infection. Requires urgent antibiotics.          │
│                                                               │
│ Risk Score Factors:                                           │
│ ✓ High fever (39.5°C)                                         │
│ ✓ Severe cough                                                │
│ ✓ Throat pain                                                 │
│ ✗ No chronic conditions                                       │
│                                                               │
│ Recommendations:                                              │
│ • Blood culture test                                          │
│ • Antibiotics (Amoxicillin/Azithromycin)                      │
│ • Fluid intake and rest                                       │
│                                                               │
│ [ View Details ]  [ Resend Email ]                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ #3  🟡 MEDIUM - Risk Score: 45/100                           │
│                                                               │
│ Dr. Kumar - General Medicine                                 │
│ 📅 January 15, 2025 at 4:30 PM                               │
│                                                               │
│ Chief Complaint: Mild headache, occasional cough              │
│ Status: [PENDING]  [CONFIRMED]                              │
│                                                               │
│ ⚠️ RISK ASSESSMENT:                                            │
│ Mild symptoms with low fever. Standard flu-like illness.      │
│ Can be managed with common over-the-counter medicines.        │
│                                                               │
│ Risk Score Factors:                                           │
│ ✗ Low fever (37.8°C)                                          │
│ ✗ Mild cough                                                  │
│ ✗ Occasional headache                                         │
│ ✓ Good health history                                         │
│                                                               │
│ Recommendations:                                              │
│ • Paracetamol for pain/fever                                  │
│ • Cough syrup                                                 │
│ • Monitor symptoms                                            │
│                                                               │
│ [ View Details ]  [ Resend Email ]                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ #4  🟢 LOW - Risk Score: 15/100                              │
│                                                               │
│ Dr. Singh - General Medicine                                 │
│ 📅 January 17, 2025 at 10:00 AM                              │
│                                                               │
│ Chief Complaint: Routine health checkup                       │
│ Status: [PENDING]  [CONFIRMED]                              │
│                                                               │
│ ✓ RISK ASSESSMENT:                                            │
│ No concerning symptoms. Routine appointment for general       │
│ health checkup. Standard appointment.                         │
│                                                               │
│ Risk Score Factors:                                           │
│ ✗ No symptoms reported                                        │
│ ✓ No fever                                                    │
│ ✓ No chronic conditions                                       │
│ ✓ Good health history                                         │
│                                                               │
│ [ View Details ]  [ Resend Email ]                           │
└───────────────────────────────────────────────────────────────┘
```

---

## 💌 Email Examples

### Appointment Confirmation Email

```
┌──────────────────────────────────────────────────────────┐
│  From: hospital@iiithospital.com                         │
│  To: raj.kumar@student.com                               │
│  Subject: Appointment Confirmed - IIIT Hospital          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ╔════════════════════════════════════════════════════╗ │
│  ║         🏥 IIIT HOSPITAL                           ║ │
│  ║     Medical Services Department                    ║ │
│  ║                                                    ║ │
│  ║   Appointment Confirmation                        ║ │
│  ║   January 15, 2025                                ║ │
│  ╚════════════════════════════════════════════════════╝ │
│                                                          │
│  Dear Raj Kumar,                                         │
│                                                          │
│  Your appointment with our medical team has been        │
│  confirmed. Please find the details below:              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Doctor Name          Dr. Patel                  │  │
│  │ Department           General Medicine           │  │
│  │ Date                 January 15, 2025           │  │
│  │ Time                 3:00 PM                    │  │
│  │ Appointment ID       APT-2025-001234           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Chief Complaints:                                      │
│  ✓ High fever                                           │
│  ✓ Severe cough                                         │
│  ✓ Sore throat                                          │
│                                                          │
│  Please Remember:                                       │
│  ✓ Arrive 10 minutes early to the appointment          │
│  ✓ Bring your student ID and medical documents        │
│  ✓ Maintain a list of current medications if any       │
│  ✓ If you need to reschedule, inform 24 hours ahead   │
│  ✓ Call emergency for any emergency symptoms          │
│                                                          │
│  ⚠️ Important: If you need to cancel or reschedule,    │
│  please contact us as soon as possible.                │
│                                                          │
│  If you have any questions, contact us.                │
│                                                          │
│  Regards,                                               │
│  🏥 IIIT Hospital                                       │
│  📍 RGUKT Campus, Telangana                             │
│  📞 +91-XXXXXXXXXX                                      │
│                                                          │
│  This is an automated email. Do not reply directly.    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### Prescription Receipt Email

```
┌──────────────────────────────────────────────────────────┐
│  From: hospital@iiithospital.com                         │
│  To: raj.kumar@student.com                               │
│  Subject: 💊 Medical Prescription from Dr. Sharma        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ╔════════════════════════════════════════════════════╗ │
│  ║     💊 MEDICAL PRESCRIPTION RECEIPT                ║ │
│  ║     🏥 IIIT Hospital                               ║ │
│  ║                                                    ║ │
│  ║  Prescription Issued: January 15, 2025            ║ │
│  ╚════════════════════════════════════════════════════╝ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Patient Name          Raj Kumar                  │  │
│  │ Student ID            CS21B001                   │  │
│  │ Doctor                Dr. Sharma                 │  │
│  │ Department            General Medicine           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  DIAGNOSIS                                               │
│  Upper Respiratory Infection                            │
│                                                          │
│  📋 PRESCRIBED MEDICINES                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ S │ Medicine      │ Dosage    │ Freq  │ Days   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 1 │ Amoxicillin  │ 1 tablet  │ TDS   │ 7 days │   │
│  │   │ 500mg        │           │       │        │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 2 │ Cetirizine   │ 1 tablet  │ OD    │ 5 days │   │
│  │   │ 10mg         │           │       │        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Medicine Timings:                                       │
│  Amoxicillin 500mg: 1:00 PM, 6:00 PM, 10:00 PM        │
│  Cetirizine 10mg: 10:00 PM                             │
│                                                          │
│  ⚠️ Important: Follow prescription exactly as written. │
│  Do not skip doses or self-adjust medication.          │
│  If side effects occur, contact doctor immediately.    │
│                                                          │
│  👨‍⚕️ DOCTOR'S ADVICE                                     │
│  Rest for 5-7 days                                      │
│  Drink warm water with honey/turmeric                  │
│  Avoid cold food and drinks                            │
│  Take medicines on prescribed times                    │
│  Seek immediate care if chest pain develops            │
│                                                          │
│  Follow-up Instructions:                                │
│  ✓ Take medicines as per prescribed timings            │
│  ✓ Complete the full course even if symptoms vanish   │
│  ✓ Follow the dietary recommendations                  │
│  ✓ Schedule follow-up as advised                       │
│  ✓ Keep this prescription for future reference         │
│                                                          │
│  Regards,                                               │
│  🏥 IIIT Hospital                                       │
│  📍 RGUKT Campus, Telangana                             │
│  📞 +91-XXXXXXXXXX                                      │
│                                                          │
│  For emergencies, call the emergency department.       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 💾 Medicine Tracking Example

### How Student Tracks Medicines

```
┌─────────────────────────────────────────────────────────────┐
│  PATIENT MEDICINE DASHBOARD - TRACK & MARK                  │
└─────────────────────────────────────────────────────────────┘

TODAY: January 16, 2025

╔═════════════════════════════════════════════════════════╗
║  📅 MORNING (7:00 AM)                                   ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  No medicines scheduled for morning                     ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════╗
║  🌤️  NOON (1:00 PM)                                     ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Amoxicillin 500mg (1 tablet)                           ║
║  ├─ Dosage: 1 tablet                                    ║
║  ├─ Due: 1:00 PM                                        ║
║  ├─ Duration: 7 days remaining                          ║
║  └─ ☑ MARK AS TAKEN                                     ║
║     ├─ Time taken: 1:15 PM ✓                            ║
║     └─ Notes: "Took with lunch"                         ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════╗
║  🌅 EVENING (6:00 PM)                                   ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Amoxicillin 500mg (1 tablet)                           ║
║  ├─ Dosage: 1 tablet                                    ║
║  ├─ Due: 6:00 PM                                        ║
║  ├─ Duration: 7 days remaining                          ║
║  └─ ⏳ NOT YET DUE (Current time: 4:30 PM)              ║
║                                                         ║
║  [ Mark as Taken ]  [ Mark as Skipped ]  [ Add Notes ]  ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════╗
║  🌙 NIGHT (10:00 PM)                                    ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Amoxicillin 500mg (1 tablet)                           ║
║  ├─ Dosage: 1 tablet                                    ║
║  ├─ Due: 10:00 PM                                       ║
║  └─ Duration: 7 days remaining                          ║
║                                                         ║
║  Cetirizine 10mg (1 tablet)                             ║
║  ├─ Dosage: 1 tablet                                    ║
║  ├─ Due: 10:00 PM                                       ║
║  └─ Duration: 5 days remaining                          ║
║                                                         ║
║  [ Mark as Taken ]  [ Mark as Skipped ]  [ Add Notes ]  ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

─────────────────────────────────────────────────────────

COMPLIANCE TRACKING

Amoxicillin 500mg:
├─ Total doses: 21 (3 doses × 7 days)
├─ Taken: 6
├─ Skipped: 0
├─ Pending: 15
└─ Compliance: 28% ✓

Cetirizine 10mg:
├─ Total doses: 5 (1 dose × 5 days)
├─ Taken: 1
├─ Skipped: 0
├─ Pending: 4
└─ Compliance: 20% ✓

Overall Compliance: 25%

─────────────────────────────────────────────────────────

HISTORY

✅ Jan 15, 1:00 PM - Amoxicillin taken
   Notes: "Took with lunch"

✅ Jan 15, 6:00 PM - Amoxicillin taken
   Notes: "Took after dinner"

✅ Jan 15, 10:00 PM - Amoxicillin taken
   Notes: "Before sleep"

✅ Jan 15, 10:00 PM - Cetirizine taken
   Notes: "For allergy prevention"

✅ Jan 16, 1:00 PM - Amoxicillin taken
   Notes: "Took with lunch"

✅ Jan 16, 6:00 PM - Amoxicillin taken
   Notes: "Took after dinner"
```

---

## 🔧 API Request/Response Examples

### Save Prescription Request

```json
POST /api/prescriptions/save

{
  "appointmentId": "639f8d12abc123def456789",
  "diagnosis": "Upper Respiratory Infection",
  "symptoms": ["fever", "cough", "sore throat"],
  "medicines": [
    {
      "name": "Amoxicillin 500mg",
      "dosage": "1 tablet",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "After meals with water",
      "timings": ["noon", "evening", "night"]
    },
    {
      "name": "Cetirizine 10mg",
      "dosage": "1 tablet",
      "frequency": "Once daily",
      "duration": "5 days",
      "instructions": "Before sleep",
      "timings": ["night"]
    }
  ],
  "notes": "Patient appears healthy, no complications expected.",
  "advice": "Rest for 5-7 days. Drink warm water with honey. Take medicines on time."
}
```

### Save Prescription Response

```json
{
  "status": 201,
  "message": "Prescription saved successfully and email sent to patient",
  "prescription": {
    "_id": "639f8d12def456789abc123",
    "appointmentId": "639f8d12abc123def456789",
    "patientId": "639f8d12xyz789abc456def",
    "doctorId": "639f8d12mno789pqr456stu",
    "diagnosis": "Upper Respiratory Infection",
    "medicines": [
      {
        "name": "Amoxicillin 500mg",
        "dosage": "1 tablet",
        "frequency": "3 times daily",
        "duration": "7 days",
        "timings": ["noon", "evening", "night"],
        "specificTimes": ["13:00", "18:00", "22:00"],
        "medicineSchedule": [...]
      },
      {
        "name": "Cetirizine 10mg",
        "dosage": "1 tablet",
        "frequency": "Once daily",
        "duration": "5 days",
        "timings": ["night"],
        "specificTimes": ["22:00"],
        "medicineSchedule": [...]
      }
    ],
    "emailSent": true,
    "emailSentAt": "2025-01-15T14:35:22.123Z",
    "status": "active",
    "createdAt": "2025-01-15T14:30:00.000Z"
  },
  "emailSent": true
}
```

### Get Medicine Timings Request

```json
GET /api/prescriptions/patient/639f8d12xyz789abc456def/medicine-timings

Response:
{
  "allMedicines": [
    {
      "medicineName": "Amoxicillin 500mg",
      "dosage": "1 tablet",
      "frequency": "3 times daily",
      "timings": ["noon", "evening", "night"],
      "specificTimes": ["13:00", "18:00", "22:00"],
      "instructions": "After meals with water",
      "duration": "7 days"
    },
    {
      "medicineName": "Cetirizine 10mg",
      "dosage": "1 tablet",
      "frequency": "Once daily",
      "timings": ["night"],
      "specificTimes": ["22:00"],
      "instructions": "Before sleep",
      "duration": "5 days"
    }
  ],
  "medicinesByTiming": {
    "morning": [],
    "noon": [{ "medicineName": "Amoxicillin 500mg", ... }],
    "evening": [{ "medicineName": "Amoxicillin 500mg", ... }],
    "night": [
      { "medicineName": "Amoxicillin 500mg", ... },
      { "medicineName": "Cetirizine 10mg", ... }
    ]
  },
  "totalActive": 1
}
```

---

## 🧪 Test Cases

### Test Case 1: Medicine Autocomplete
```
Input: Type "para" in medicine field
Expected: Suggestions for Paracetamol appear
Action: Press TAB
Expected: Auto-completes to "Paracetamol 650mg"
Result: ✅ PASS
```

### Test Case 2: Risk Assessment
```
Input: Appointment with symptoms: ["chest pain", "shortness of breath"]
Expected: Risk level = CRITICAL (>90 score)
Result: ✅ PASS
```

### Test Case 3: Email Sending
```
Input: Save prescription
Expected: Email sent to patient within 5 seconds
Check: Patient receives email with medicine table
Result: ✅ PASS
```

### Test Case 4: Medicine Compliance
```
Input: Mark medicine as taken
Expected: medicineSchedule updated
Expected: compliance tracking increased
Result: ✅ PASS
```

---

## 📞 Support Examples

### Issue: "Groq API not configured"
```
Symptom: Medicine suggestions not appearing
Troubleshoot:
1. Click "Configure AI" in sidebar
2. Paste your API key from console.groq.com
3. Click "Test Connection"
4. Verify green checkmark appears
5. Refresh page

Solution: ✅ Medicine autocomplete now works
```

---

**This completes all use case examples and test scenarios!**

Version: 1.0.0
Last Updated: December 28, 2025
