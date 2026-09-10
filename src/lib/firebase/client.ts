import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase Client configuration and instance management.
 * Designed with Local-First resilience: if credentials are not provided,
 * the app continues to operate seamlessly using local storage without throwing errors.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Checks if the minimal required Firebase configuration values are present.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== "your_firebase_api_key_here" &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== "your_project_id_here"
  );
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured()) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      db = getFirestore(app);
      // Helpful info log
      console.info("[NutriTrack AI] Firebase Firestore successfully initialized.");
    } catch (err) {
      console.warn("[NutriTrack AI] Firebase initialization error. Falling back to local mode:", err);
      app = null;
      db = null;
    }
  } else {
    // Graceful local mode
    if (process.env.NODE_ENV === "development") {
      console.info("[NutriTrack AI] Firebase credentials not found or placeholder. Running in Local-First Mode.");
    }
  }
}

export { app, db };
