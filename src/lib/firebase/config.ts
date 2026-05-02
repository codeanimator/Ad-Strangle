import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Client SDK Initialization
let app;
let auth: any;
let db: any;
let storage: any;

try {
  if (firebaseConfig.apiKey !== "dummy-key") {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Stability Fix for Cloud Run: Force Long Polling to prevent gRPC stream crashes
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    
    storage = getStorage(app);
  }
} catch (e) {
  console.error("Firebase Client initialization skipped or failed");
}

export { app, auth, db, storage };
