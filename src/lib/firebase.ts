import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCXjttRhyIIKJnWGsQ2N1hMzZoutzl7bwA",
  authDomain: "inventory-management-c6c77.firebaseapp.com",
  projectId: "inventory-management-c6c77",
  storageBucket: "inventory-management-c6c77.appspot.com",
  messagingSenderId: "82110059671",
  appId: "1:82110059671:web:3c9163c0243ad1642405d2",
  measurementId: "G-KNJ24JJ0H1"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators if in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost') {
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export { app, db, auth, storage };