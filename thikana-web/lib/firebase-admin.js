import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load service account from the JSON file at repo root
// This avoids hardcoding keys and ensures they stay fresh after rotation.
let serviceAccountConfig;
try {
  const saPath = resolve(process.cwd(), "..", "serviceAccountKey.json");
  serviceAccountConfig = JSON.parse(readFileSync(saPath, "utf-8"));
} catch {
  // Fallback: try cwd directly (in case cwd IS the repo root)
  try {
    const saPath = resolve(process.cwd(), "serviceAccountKey.json");
    serviceAccountConfig = JSON.parse(readFileSync(saPath, "utf-8"));
  } catch (err) {
    console.error("Could not load serviceAccountKey.json:", err.message);
    throw new Error(
      "Firebase Admin: serviceAccountKey.json not found. Place it at the repo root."
    );
  }
}

// Initialize Firebase Admin SDK (singleton — handles Next.js HMR re-imports)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountConfig),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

// Get Firestore & Auth instances
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
export default admin;
