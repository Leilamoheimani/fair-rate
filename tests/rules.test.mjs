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

const run = (uid, runId = "r1") => ({
  uid, runId, lang: "de", startedAt: serverTimestamp(), appVersion: "test", userAgent: "ua", viewport: "390x844", language: "de",
});
const task = (uid, n = 1, runId = "r1") => ({
  uid, runId, task: n, status: "reached", durationMs: 12000, clicks: 7, endScreen: "projekt",
  answers: { ease: 4, summary: "Preise berechnen", prefer_single_price: "no", approach: null }, appVersion: "test", createdAt: serverTimestamp(),
});
const final = (uid, runId = "r1") => ({
  uid, runId, answers: { confidence: 3, unclear: "nichts", would_use: "maybe" }, totalMs: 300000,
  path: ["start@0", "projekt@5"], events: ["whyOpened@40"], choices: { profession: "Design", services: ["Konzept"] },
  appVersion: "test", createdAt: serverTimestamp(),
});

const runPath = (db, uid) => doc(db, "participants", uid, "runs", "r1");
const taskPath = (db, uid, id = "1") => doc(db, "participants", uid, "runs", "r1", "tasks", id);
const finalPath = (db, uid, id = "final") => doc(db, "participants", uid, "runs", "r1", "final", id);

test("participant can create own run, task results and final answers", async () => {
  const db = alice();
  await assertSucceeds(setDoc(runPath(db, "alice"), run("alice")));
  await assertSucceeds(setDoc(taskPath(db, "alice"), task("alice")));
  await assertSucceeds(setDoc(taskPath(db, "alice", "4"), { ...task("alice", 4), status: "stuck", answers: {} }));
  await assertSucceeds(setDoc(finalPath(db, "alice"), final("alice")));
  await assertSucceeds(getDoc(taskPath(db, "alice")));
});

test("unauthenticated users can do nothing", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(setDoc(runPath(db, "alice"), run("alice")));
  await assertFails(getDoc(runPath(db, "alice")));
});

test("participant cannot write or read someone else's data", async () => {
  await assertSucceeds(setDoc(runPath(alice(), "alice"), run("alice")));
  await assertFails(setDoc(runPath(bob(), "alice"), run("alice")));
  await assertFails(setDoc(runPath(bob(), "alice"), run("bob")));
  await assertFails(getDoc(runPath(bob(), "alice")));
  await assertFails(getDocs(collectionGroup(bob(), "runs")));
});

test("results are write-once", async () => {
  const db = alice();
  await assertSucceeds(setDoc(taskPath(db, "alice"), task("alice")));
  await assertFails(setDoc(taskPath(db, "alice"), task("alice")));
  await assertFails(deleteDoc(taskPath(db, "alice")));
});

test("invalid data is rejected", async () => {
  const db = alice();
  await assertFails(setDoc(runPath(db, "alice"), { ...run("alice"), extra: true }));
  await assertFails(setDoc(runPath(db, "alice"), { ...run("alice"), lang: "fr" }));
  await assertFails(setDoc(runPath(db, "alice"), { ...run("alice"), startedAt: new Date(0) }));
  await assertFails(setDoc(taskPath(db, "alice", "5"), task("alice", 5)));
  await assertFails(setDoc(taskPath(db, "alice", "2"), task("alice", 1)));
  await assertFails(setDoc(taskPath(db, "alice"), { ...task("alice"), status: "done" }));
  await assertFails(setDoc(taskPath(db, "alice"), { ...task("alice"), durationMs: -1 }));
  await assertFails(setDoc(taskPath(db, "alice"), { ...task("alice"), answers: { ease: 9 } }));
  await assertFails(setDoc(taskPath(db, "alice"), { ...task("alice"), answers: { unknown: "x" } }));
  await assertFails(setDoc(taskPath(db, "alice"), { ...task("alice"), answers: { summary: "x".repeat(2001) } }));
  await assertFails(setDoc(finalPath(db, "alice"), { ...final("alice"), choices: "x" }));
  await assertFails(setDoc(finalPath(db, "alice", "other"), final("alice")));
});

test("only the admin can read across participants", async () => {
  await setDoc(runPath(alice(), "alice"), run("alice"));
  await setDoc(taskPath(alice(), "alice"), task("alice"));
  await setDoc(finalPath(alice(), "alice"), final("alice"));
  for (const name of ["runs", "tasks", "final"]) {
    const snap = await assertSucceeds(getDocs(collectionGroup(admin(), name)));
    if (snap.size !== 1) throw new Error(`expected 1 ${name}, got ${snap.size}`);
  }
  const fakeAdmin = env.authenticatedContext("eve", { firebase: { sign_in_provider: "google.com" } }).firestore();
  await assertFails(getDocs(collectionGroup(fakeAdmin, "runs")));
  await assertFails(setDoc(runPath(admin(), "alice"), run("alice", "r2")));
});
