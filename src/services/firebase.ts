import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const defaultConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCzRh7WbxeXxvAZAlPDusEqT5STFpqJujM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fifaworldcup-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fifaworldcup-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fifaworldcup-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "136925832186",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:136925832186:web:daf102146e79eef3ebfa43"
};

const app = initializeApp(defaultConfig);

export let auth = getAuth(app);
export const firestore = getFirestore(app);

// Enable hot-swapping configuration at runtime if deployed on a different Firebase project
export function initFirebase(config: any) {
  if (config && config.apiKey && config.apiKey !== defaultConfig.apiKey) {
    try {
      const dynamicApp = initializeApp(config, "dynamic");
      auth = getAuth(dynamicApp);
      // NOTE: We keep firestore pointing to the default instance unless explicitly required,
      // but re-routing auth satisfies sign-in workflows perfectly.
      console.log("Firebase Auth dynamically re-configured using server environment parameters.");
    } catch (e) {
      console.error("Firebase auto-configuration hot-swap failed:", e);
    }
  }
}
