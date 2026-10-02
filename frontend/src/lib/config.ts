// Firebase web config. This is NOT secret: access is controlled by firestore.rules.
// Fill in from Firebase console → Project settings → Your apps → Web app → SDK setup.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Google account that may open #/admin and download the data.
// Must match the email in firestore.rules (isAdmin).
export const ADMIN_EMAIL: string = import.meta.env.VITE_ADMIN_EMAIL || "";

export const isFirebaseConfigured = firebaseConfig.projectId !== "";

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || "dev";
