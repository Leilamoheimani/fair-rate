// Firebase web config. This is NOT secret: access is controlled by firestore.rules.
// Fill in from Firebase console → Project settings → Your apps → Web app → SDK setup.
export const firebaseConfig = {
  apiKey: "AIzaSyDn4ow38TAUdfrIrRtuGd5pPPCWSmWUyQ4",
  authDomain: "fair-rate.firebaseapp.com",
  projectId: "fair-rate",
  storageBucket: "fair-rate.firebasestorage.app",
  messagingSenderId: "20227247403",
  appId: "1:20227247403:web:c59929db4ac758e227896e",
};

// Google account that may open #/admin and download the data.
// Must match the email in firestore.rules (isAdmin).
export const ADMIN_EMAIL: string = import.meta.env.VITE_ADMIN_EMAIL || "";

export const isFirebaseConfigured = firebaseConfig.projectId !== "";

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || "dev";
