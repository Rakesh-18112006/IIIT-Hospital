import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, use environment variables or service account file
const initializeFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'your-client-email',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || 'your-private-key').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
};

export default initializeFirebase;
