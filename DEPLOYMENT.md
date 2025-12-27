# QR Code Feature - Deployment & Setup Guide

## Environment Setup

### Prerequisites
- Node.js v16+ 
- MongoDB instance
- Git
- npm or yarn

---

## Local Development Setup

### Step 1: Install Backend Dependencies

```bash
cd backend

# Install QR code related packages
npm install qrcode uuid

# Verify installation
npm list qrcode uuid
```

**Expected output:**
```
├── qrcode@14.x.x
└── uuid@9.x.x
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend

# Install QR scanner package
npm install qr-scanner

# Verify installation
npm list qr-scanner
```

**Expected output:**
```
└── qr-scanner@2.x.x
```

---

## Environment Variables

### Backend `.env` File

No new environment variables are required. The QR code feature uses existing auth tokens and database connection.

```bash
# Existing variables (no changes needed)
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

### Frontend `.env` File

No new environment variables are required.

```bash
# Existing variables
VITE_API_URL=http://localhost:5000/api
```

---

## Database Migration

The application automatically handles database updates. When a student generates their first QR code:

1. MongoDB adds the `qrCode` and `qrCodeGenerated` fields to that user document
2. No migration script needed
3. Fields are sparse indexed (only stored when present)

### Verify Database Changes

```bash
# Connect to MongoDB
mongo your_database

# Check User schema
db.users.findOne({ role: "student" })

# Should show (after QR generation):
{
  _id: ObjectId(...),
  name: "...",
  email: "...",
  role: "student",
  ...existing fields...,
  qrCode: "{\"userId\":\"...\",\"studentId\":\"...\",\"token\":\"...\",\"generatedAt\":\"...\"}",
  qrCodeGenerated: true
}
```

---

## Running the Application Locally

### Terminal 1 - Backend Server

```bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Expected output:
# Server running on port 5000
# MongoDB connected successfully
# [nodemon] restarting due to file changes
```

### Terminal 2 - Frontend Dev Server

```bash
cd frontend

# Run in development mode
npm run dev

# Expected output:
# VITE v4.x.x ready in 123 ms
# ➜ Local: http://localhost:5173/
# ➜ press h to show help
```

### Access Application

Open browser to: **http://localhost:5173**

---

## Testing Locally

### Test 1: Generate QR Code

1. **Login as Student**
   - Go to http://localhost:5173
   - Click Login
   - Use student credentials

2. **Navigate to QR Code Tab**
   - Click "My QR Code" in sidebar
   - Page should load with "Generate QR Code" button

3. **Generate QR Code**
   - Click "Generate QR Code"
   - Wait for generation (should be <1 second)
   - QR code image should appear
   - Student info should be displayed

### Test 2: Scan QR Code

1. **Logout and Login as Doctor**
   - Click Logout
   - Login with doctor credentials

2. **Navigate to QR Scanner Tab**
   - Click "QR Scanner" in sidebar
   - See textarea for QR data input

3. **Get QR Data**
   - Use any online QR decoder to scan the student's QR code
   - Or manually copy the JSON from the first test

4. **Scan**
   - Paste QR data in textarea
   - Click "Scan QR Code"
   - Patient information should appear
   - Medical records should load

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database schema validated
- [ ] All endpoints tested locally
- [ ] No console errors
- [ ] All environment variables set
- [ ] Tests passed

### Backend Deployment

#### Using PM2

```bash
cd backend

# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "hospital-api"

# View logs
pm2 logs hospital-api

# Restart on file changes
pm2 watch

# Stop application
pm2 stop hospital-api

# View all processes
pm2 list
```

#### Using Docker

```dockerfile
# Dockerfile for backend
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hospital-api .
docker run -p 5000:5000 -e MONGODB_URI=... hospital-api
```

#### Using Ubuntu/Linux Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/hospital-api.service
```

```ini
[Unit]
Description=Hospital API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/hospital-backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="MONGODB_URI=mongodb://..."

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hospital-api
sudo systemctl start hospital-api
sudo systemctl status hospital-api
```

### Frontend Deployment

#### Build for Production

```bash
cd frontend

# Create optimized build
npm run build

# Output in: dist/ folder
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Project name: hospital-frontend
# Framework: Vite
# Build command: npm run build
# Output directory: dist
```

#### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build first
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Install AWS CLI
pip install awscli

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## Health Checks

### Backend Health Check

```bash
curl http://localhost:5000/api/health

# Expected response:
# { "status": "ok", "timestamp": "..." }
```

### Verify Database Connection

```bash
# Check if MongoDB is connected
curl http://localhost:5000/api/patient/queue \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"

# Should return patient queue data
```

### Verify QR Endpoints

```bash
# Test QR generation endpoint
curl http://localhost:5000/api/patient/generate-qr \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/json"

# Should return QR code data
```

---

## Performance Optimization

### Backend Optimization

```javascript
// 1. Add request timeout middleware
const timeout = require('connect-timeout');
app.use(timeout('30s'));

// 2. Add compression middleware
const compression = require('compression');
app.use(compression());

// 3. Enable caching for QR codes
// In patientController.js
router.get('/my-qr', protect, 
  cacheMiddleware('5 minutes'),
  getStudentQRCode
);
```

### Frontend Optimization

```javascript
// 1. Code splitting for QR Scanner
const QRScanner = React.lazy(() => 
  import('./components/QRScanner')
);

// 2. Memoize components
const QRCodeDisplay = React.memo(({ qrCode }) => {
  return <img src={qrCode.qrCodeImage} />;
});

// 3. Optimize re-renders
useCallback(() => {
  handleQRCodeInput(qrData);
}, [qrData])
```

### Database Optimization

```javascript
// 1. Add indexes for faster queries
db.users.createIndex({ studentId: 1 });
db.users.createIndex({ qrCode: 1 });
db.patientrecords.createIndex({ student: 1, createdAt: -1 });

// 2. Add sparse indexes
db.users.createIndex({ qrCode: 1 }, { sparse: true });
```

---

## Monitoring & Logging

### Backend Logging

```javascript
// Use winston for logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log QR operations
logger.info('QR code generated', { userId, studentId });
logger.info('QR code scanned', { scanningDoctorId, studentId });
```

### Frontend Error Tracking

```javascript
// Use Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### API Monitoring

```bash
# Monitor API performance
pm2 install pm2-logrotate

# Monitor memory usage
pm2 start server.js --watch --max-memory-restart 500M
```

---

## Troubleshooting Deployment

### Issue: QR Code Generation Fails
**Solution:**
- Check if `qrcode` package is installed: `npm list qrcode`
- Verify backend is running: `curl http://localhost:5000/health`
- Check logs: `pm2 logs hospital-api`

### Issue: Frontend Cannot Connect to Backend
**Solution:**
- Verify backend URL in frontend `.env`: `VITE_API_URL`
- Check CORS is enabled in backend
- Verify both services are running on correct ports

### Issue: Database Connection Error
**Solution:**
- Test MongoDB connection: `mongo connection_string`
- Check `MONGODB_URI` in backend `.env`
- Verify MongoDB is running

### Issue: QR Code Image Not Loading
**Solution:**
- Check browser console for errors
- Verify base64 data is valid
- Check image MIME type: `image/png`
- Clear browser cache

---

## Rollback Procedure

If issues occur after deployment:

```bash
# Using PM2
pm2 stop hospital-api
pm2 delete hospital-api
git checkout previous_commit
npm install
pm2 start server.js --name "hospital-api"

# Using Docker
docker stop hospital-api
docker rm hospital-api
docker rmi hospital-api
git checkout previous_commit
docker build -t hospital-api .
docker run -p 5000:5000 hospital-api
```

---

## Security Hardening

### HTTPS Configuration

```javascript
// backend/server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

### CORS Configuration

```javascript
// Allow specific frontend origin only
const cors = require('cors');
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Backup & Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=./backup

# Scheduled backup (cron)
0 2 * * * mongodump --uri="mongodb://..." --out=/backups/$(date +\%Y\%m\%d)
```

### Restore from Backup

```bash
mongorestore --uri="mongodb://..." ./backup
```

---

## Conclusion

The QR code feature is now ready for production deployment. Follow these guidelines for a smooth deployment process.

For support or issues:
- Check logs: `pm2 logs` or `docker logs`
- Review API endpoints: See `IMPLEMENTATION_GUIDE.md`
- Check test cases: See `TEST_CASES.md`
