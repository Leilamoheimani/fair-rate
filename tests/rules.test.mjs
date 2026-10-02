import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collectionGroup, doc, getDoc, getDocs, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";

const ADMIN = "admin-uid";
let env;

before(async () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8").replace(/request\.auth\.uid == '[^']*'/, `request.auth.uid == '${ADMIN}'`);
  env = await initializeTestEnvironment({ projectId: "demo-fair-rate", firestore: { rules } });
});
after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const alice = () => env.authenticatedContext("alice", { firebase: { sign_in_provider: "anonymous" } }).firestore();
const bob = () => env.authenticatedContext("bob", { firebase: { sign_in_provider: "anonymous" } }).firestore();
const admin = () => env.authenticatedContext(ADMIN, { firebase: { sign_in_provider: "google.com" } }).firestore();

const session = (uid, sessionId = "s1") => ({
  uid, sessionId, startedAt: serverTimestamp(), appVersion: "test", userAgent: "ua", viewport: "390x844", language: "de",
});
const step = (uid, sessionId = "s1") => ({
  uid, sessionId, index: 0, screen: 0, screenName: "start", toScreen: 2, toScreenName: "projekt",
  enteredAt: 1700000000000, durationMs: 1200, state: { profession: "Design", services: ["Konzept"] }, appVersion: "test", createdAt: serverTimestamp(),
});
const feedback = (uid, sessionId = "s1") => ({
  uid, sessionId, confidence: 4, unclear: "nichts", path: "full", state: {}, appVersion: "test", createdAt: serverTimestamp(),
});

const sessionPath = (db, uid) => doc(db, "participants", uid, "sessions", "s1");
const stepPath = (db, uid) => doc(db, "participants", uid, "sessions", "s1", "steps", "0000");
const feedbackPath = (db, uid, id = "final") => doc(db, "participants", uid, "sessions", "s1", "feedback", id);

test("participant can create own session, step and feedback", async () => {
  const db = alice();
  await assertSucceeds(setDoc(sessionPath(db, "alice"), session("alice")));
  await assertSucceeds(setDoc(stepPath(db, "alice"), step("alice")));
  await assertSucceeds(setDoc(feedbackPath(db, "alice"), feedback("alice")));
  await assertSucceeds(getDoc(stepPath(db, "alice")));
});

test("unauthenticated users can do nothing", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(setDoc(sessionPath(db, "alice"), session("alice")));
  await assertFails(getDoc(sessionPath(db, "alice")));
});

test("participant cannot write or read someone else's data", async () => {
  await assertSucceeds(setDoc(sessionPath(alice(), "alice"), session("alice")));
  await assertFails(setDoc(sessionPath(bob(), "alice"), session("alice")));
  await assertFails(setDoc(sessionPath(bob(), "alice"), session("bob")));
  await assertFails(getDoc(sessionPath(bob(), "alice")));
  await assertFails(getDocs(collectionGroup(bob(), "sessions")));
});

test("results are write-once", async () => {
  const db = alice();
  await assertSucceeds(setDoc(stepPath(db, "alice"), step("alice")));
  await assertFails(setDoc(stepPath(db, "alice"), step("alice")));
  await assertFails(deleteDoc(stepPath(db, "alice")));
});

test("invalid data is rejected", async () => {
  const db = alice();
  await assertFails(setDoc(sessionPath(db, "alice"), { ...session("alice"), extra: true }));
  await assertFails(setDoc(sessionPath(db, "alice"), { ...session("alice"), startedAt: new Date(0) }));
  await assertFails(setDoc(stepPath(db, "alice"), { ...step("alice"), durationMs: -1 }));
  await assertFails(setDoc(stepPath(db, "alice"), { ...step("alice"), state: "x" }));
  await assertFails(setDoc(feedbackPath(db, "alice"), { ...feedback("alice"), confidence: 9 }));
  await assertFails(setDoc(feedbackPath(db, "alice"), { ...feedback("alice"), unclear: "x".repeat(2001) }));
  await assertFails(setDoc(feedbackPath(db, "alice", "other"), feedback("alice")));
});

test("only the admin can read across participants", async () => {
  await setDoc(sessionPath(alice(), "alice"), session("alice"));
  await setDoc(stepPath(alice(), "alice"), step("alice"));
  await setDoc(feedbackPath(alice(), "alice"), feedback("alice"));
  for (const name of ["sessions", "steps", "feedback"]) {
    const snap = await assertSucceeds(getDocs(collectionGroup(admin(), name)));
    if (snap.size !== 1) throw new Error(`expected 1 ${name}, got ${snap.size}`);
  }
  const fakeAdmin = env.authenticatedContext("eve", { firebase: { sign_in_provider: "google.com" } }).firestore();
  await assertFails(getDocs(collectionGroup(fakeAdmin, "sessions")));
  await assertFails(setDoc(sessionPath(admin(), "alice"), session("alice", "s2")));
});
