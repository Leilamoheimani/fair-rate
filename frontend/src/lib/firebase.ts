import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously, type User } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

// `npm run dev:emulators` talks to the local Firebase emulators instead of the real project.
const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

export const firebaseEnabled = isFirebaseConfigured || useEmulators;
export const app = firebaseEnabled
  ? initializeApp(useEmulators ? { apiKey: "demo-key", projectId: "demo-fair-rate", authDomain: "localhost" } : firebaseConfig)
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (useEmulators && auth && db) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

let participant: Promise<User | null> | null = null;

/** Resolves to the current user, signing in anonymously if nobody is signed in. */
export function ensureParticipant(): Promise<User | null> {
  if (!auth) return Promise.resolve(null);
  participant ??= (async () => {
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser;
    try {
      return (await signInAnonymously(auth)).user;
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      participant = null;
      return null;
    }
  })();
  return participant;
}
