import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin";

// Get Firebase Admin credentials from environment variables
const serviceAccountConfig = {
  "type": "service_account",
  "project_id": "technions-thikana",
  "private_key_id": "7d7753f6c4b8b26a84f4a64879cb4bd1c2b4f872",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDOpV6Bimcq2XqP\nJw63T/NyJZ3x2sLsIx+c9g3YLnuYt5AGwlioYuYLgSYo5PQVQVfaBMz9wCMQEgB2\n6rbx/AyEp8lo6hCn3HUUWtf1BhbANNL7p0x7h53PhD5kp2ZkAnxB/TQLN+zRR3nv\ngnCvH/0IR1hNS7KS9BwNll2nAOgcjZxllLNcfp3AR4uMKkjve4F3XALoBhEq+1qZ\nYQNPC82vIVdj2K7O674PotH4rNOkgxLN8rrSMnFO0EBxivDsmFstLiHwgMCDH8Xm\nhsMifJSGhFJWqLQBYL5p25NE4ZpfTHFCTZr6uYmne5YyTCQr4EF5xLEGaw35gfJb\nPnFwxaLjAgMBAAECggEAQ+8Xj4yZd/vBD9iuPNNa3BbDwuPBGvI9DVPSn1RAq6cF\nAUPY85p3uCaADgeeunId2H2linIk1L6mSnHFLO5Iiz/BtezlBtox3zwyLMoQpqV3\nCuYn/aBK4BLAlER4I76xbNw5xMpg3zgZPQTr2Jayj4ss21RcY3U+17SsGx/wLppE\nCRELOWonDplr89MnZcIesW6x9R7tlng6xtVedWtbE0WuAz8xJ9EsvG09oPWgG76E\npDd74q8NozFsdSu+4HU83I9GIUPogDpKIFiCBJLPPsOMJKIpKCKDBmEhYTQvaE4M\nVEpUeWYGqBNzmyJNAJupliLVYwTvtEI5tGBkgv7wiQKBgQDv0/GekKyC3Zh1s6pd\n2IQfiL25OC/tIfrHltvgrQw5vPoiKtkXS+j4v5IL3mBKpd+tk8IwLFYHWsta3Xe8\np5AWtdzLBx095gl6A0TL9ruqZlsBHmTb1vzwSt0suDJnq8/szpYu1SpiIw9uef1C\n+cfbVOvCZx8ckIDz9P0QkKnl3QKBgQDclJ5WObnJ41sDS3g9Zeqy8BA1dzg4GWzs\nnLBMrJlyAM6ENzzHqG9/UeteSVA91gGCTlQLSyFEUdPgF/zdgQwmK0td0hZi3/lV\n5ZQ7n22NRaPYvrUbbTsMMcoWJregiJMfGwI8KHnrnkzos8IleKrIxI/KohK+7sL4\nNq2jO3z/vwKBgQDZDxco70Hjc5IQPVsdcuAp9kXYhF0EH3Ps/sHkuFpPS5WMJQG0\nzxR9Rk11hn/aMAShAhGILihyoZ9ZjwZW7cVAeLrr2nWB11iOYLT8cURqthb5jTu1\nqP/mr6s8VT3xjJQ0fMl6e53PknHeCHTLEGztOw/iNBj5bmP36Ky+OGA81QKBgBRl\nea6nb9KHP2cyl0+2GNmq8RTAjWZCk5vdcT/lxdqQ0IfRQ8GChazUOlthlBXjsAgI\njiTtMYpLtrfGAA/LWwA8iJ+ISaGi7D9RFz/cIhkqE1h7aeu7UfZytCkQM3KYrmH1\n8WL2qy9qV9o8pPsqCUC/TDyEeA9HrKefBrdNTOWpAoGBAMzC8094RhRT692UMFB0\nH0fCJQjCLLsSTMKfJ3Zm7JS+JIVWFrJgWu4AWLWghnswG97v2VuzphtgSwLqukhs\nihLAwO455XNCzfnn5L2WX/Hm8AR/FNNmXeDAUADX9TMjrmmVeOkw0kHLaz8chqqt\nb5eHdWqvtHYLBTDUUm4SoEh+\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@technions-thikana.iam.gserviceaccount.com",
  "client_id": "110746480382868637496",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40technions-thikana.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Verify required fields exist
if (!serviceAccountConfig.project_id) {
  throw new Error(
    "Service account object must contain a string 'project_id' property."
  );
}

if (!serviceAccountConfig.private_key) {
  throw new Error(
    "Service account object must contain a string 'private_key' property."
  );
}

// Initialize Firebase Admin SDK if not already initialized
const apps = getApps();
let app;

if (apps.length > 0) {
  app = apps[0];
} else {
  try {
    app = initializeApp({
      credential: admin.credential.cert(serviceAccountConfig),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

// Get Firestore instance
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminDb, adminAuth };
export default admin;
