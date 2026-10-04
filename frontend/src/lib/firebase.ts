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

let signingIn: Promise<User | null> | null = null;

/**
 * Resolves to whoever is signed in right now, signing in anonymously if nobody is.
 * Checked on every write: the admin page in another tab shares the same login and
 * can sign in or out in the middle of a test.
 */
export async function ensureParticipant(): Promise<User | null> {
  if (!auth) return null;
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  signingIn ??= signInAnonymously(auth)
    .then((credential) => credential.user, (error) => {
      console.error("Anonymous sign-in failed", error);
      return null;
    })
    .finally(() => (signingIn = null));
  return signingIn;
}
