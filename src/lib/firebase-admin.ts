
import admin from 'firebase-admin';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let adminDb: Firestore;
let adminAuth: Auth;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const isConfigured = projectId && clientEmail && privateKey;

  if (isConfigured) {
    if (!getApps().length) {
      initializeApp({
        credential: credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
      console.log('Firebase Admin SDK Initialized Successfully.');
    }
    adminDb = getFirestore();
    adminAuth = getAuth();
  } else {
    console.warn(
      '********************************************************************************\n' +
        '[Firebase Admin Check] FIREBASE ADMIN SDK IS NOT CONFIGURED.\n' +
        'Server-side operations will fail. Please ensure all required FIREBASE_* variables are set in your .env.local file.\n' +
        '********************************************************************************'
    );
    adminDb = {} as Firestore;
    adminAuth = {} as Auth;
  }
} catch (error: any) {
  console.error('Firebase Admin Initialization failed:', error.message);
  adminDb = {} as Firestore;
  adminAuth = {} as Auth;
}

export { adminDb, adminAuth };
