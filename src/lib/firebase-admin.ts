import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const adminDb = admin.firestore();

// Test the connection
adminDb.collection('products').limit(1).get()
  .then(() => console.log('Firebase Admin connection test successful'))
  .catch(error => console.error('Firebase Admin connection test failed:', error)); 