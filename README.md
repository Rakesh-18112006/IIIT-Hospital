# IIIT Smart University Healthcare System

A comprehensive healthcare management system designed for university campus health centers.

## 🏥 Overview

This system provides role-based dashboards for managing student health records, doctor consultations, hospital administration, and mess dietary recommendations.

## 🎯 Features

### 4 Role-Based Dashboards

1. **Student Dashboard**
   - Google OAuth login
   - Submit symptoms with severity auto-classification
   - View doctor advice and prescriptions
   - Check medical leave status
   - View diet recommendations
   - Emergency contact button

2. **Doctor Dashboard**
   - Live patient queue sorted by severity
   - Patient severity classification (Red/Orange/Green)
   - View symptoms and patient history
   - Suggest tests, prescriptions, and advice
   - Issue medical leaves
   - Create diet recommendations

3. **Hospital Admin Dashboard**
   - Total patients today statistics
   - Severity distribution charts
   - Doctor workload tracking
   - Bed/resource usage (simulation)
   - Disease trend analytics
   - Weekly reports

4. **Mess Dashboard**
   - View diet recommendations (Light/Normal/Special)
   - Student count per diet type
   - Update diet status
   - No access to medical details (privacy compliant)

## 🛠️ Tech Stack

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Authentication:** 
  - Students: Google OAuth (Firebase)
  - Staff: JWT-based Email/Password

## 🎨 Design Theme

- **Primary Color:** Sky Blue (#0ea5e9)
- **Background:** White (#ffffff)
- Clean, modern, accessible UI

## 📁 Project Structure

```
IIIT-Hospital/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── firebase.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── adminController.js
│   │   └── messController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── PatientRecord.js
│   │   ├── MedicalLeave.js
│   │   └── DietRecommendation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── adminRoutes.js
│   │   └── messRoutes.js
│   ├── utils/
│   │   └── severityLogic.js
│   ├── server.js
│   ├── seed.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── config/
    │   │   ├── api.js
    │   │   └── firebase.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── MessDashboard.jsx
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- Firebase Project (for Google OAuth)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/iiit_hospital
# JWT_SECRET=your_secret_key

# Seed demo data
npm run seed

# Start server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:5000/api
# VITE_FIREBASE_API_KEY=your_firebase_key
# ... other firebase config

# Start development server
npm run dev
```

## 🔐 Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@iiit.ac.in | password123 |
| Doctor 2 | doctor2@iiit.ac.in | password123 |
| Hospital Admin | admin@iiit.ac.in | password123 |
| Mess Admin | mess@iiit.ac.in | password123 |

**Students:** Login with Google OAuth

## 🤖 Severity Classification Logic

Rule-based system (located in `utils/severityLogic.js`):

- **RED (Critical):** Fever + Chest pain, Difficulty breathing, Severe symptoms
- **ORANGE (Moderate):** Fever + Weakness, Persistent symptoms
- **GREEN (Normal):** Mild symptoms like cold, minor headaches

⚠️ **Note:** This is decision-support only, not final diagnosis.

## 🔒 Privacy & Security

- Role-based access control (RBAC)
- Medical details hidden from non-medical roles
- Mess dashboard cannot see symptoms/diagnosis
- Admin dashboard shows only aggregate statistics
- JWT-based authentication with secure password hashing

## 📱 Responsive Design

- Desktop-first design
- Fully responsive for mobile devices
- Touch-friendly interface

## 🛡️ API Endpoints

### Authentication
- `POST /api/auth/google` - Student Google login
- `POST /api/auth/login` - Staff email/password login
- `GET /api/auth/me` - Get current user

### Patient (Student)
- `POST /api/patient/symptoms` - Submit symptoms
- `GET /api/patient/my-records` - Get own records
- `GET /api/patient/my-leaves` - Get medical leaves
- `GET /api/patient/my-diet` - Get diet recommendations

### Doctor
- `GET /api/patient/queue` - Get patient queue
- `GET /api/patient/:id` - Get patient details
- `PUT /api/patient/:id` - Update patient record
- `POST /api/patient/:id/leave` - Create medical leave
- `POST /api/patient/:id/diet` - Create diet recommendation

### Hospital Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/doctors` - List doctors
- `GET /api/admin/weekly-report` - Weekly report

### Mess Admin
- `GET /api/mess/diets` - Active diet recommendations
- `GET /api/mess/stats` - Diet statistics
- `PUT /api/mess/diets/:id` - Update diet status

## 📄 License

MIT License - Built for IIIT University Hackathon
