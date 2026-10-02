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

// Firebase Auth UID of the Google account that may open #/admin and download the data.
// (A UID instead of an email so no personal data sits in this public repo.)
// Must match the UID in firestore.rules (isAdmin). #/admin shows your UID after signing in.
export const ADMIN_UID: string = import.meta.env.VITE_ADMIN_UID || "ADMIN_UID_NOT_SET";

export const isFirebaseConfigured = firebaseConfig.projectId !== "";

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || "dev";
