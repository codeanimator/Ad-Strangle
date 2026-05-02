import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ad-strangle',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Use replace to handle escaped newlines in the private key from .env files
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ad-strangle.firebasestorage.app",
};

if (!admin.apps.length && firebaseAdminConfig.projectId) {
  try {
    // Priority 1: Service Account Credentials from Env
    if (firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: firebaseAdminConfig.privateKey,
        }),
        storageBucket: firebaseAdminConfig.storageBucket,
      });
      console.log("[FIREBASE-ADMIN] Initialized via Service Account Env");
    } else {
      // Priority 2: Application Default Credentials (for Cloud Run)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: firebaseAdminConfig.storageBucket,
      });
      console.log("[FIREBASE-ADMIN] Initialized via Application Default");
    }
  } catch (e) {
    // Priority 3: Project ID Fallback (limited functionality)
    try {
      admin.initializeApp({
        projectId: firebaseAdminConfig.projectId,
        storageBucket: firebaseAdminConfig.storageBucket,
      });
      console.log("[FIREBASE-ADMIN] Initialized via Project ID Fallback");
    } catch (err) {
      console.error("[FIREBASE-ADMIN] Initialization Failed:", err);
    }
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
