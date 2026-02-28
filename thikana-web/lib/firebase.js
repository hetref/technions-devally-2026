import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAmeiJL30TNVLwcdxQeYG-RNmnAQCzmCb4",
    authDomain: "technions-thikana.firebaseapp.com",
    projectId: "technions-thikana",
    storageBucket: "technions-thikana.firebasestorage.app",
    messagingSenderId: "611591123678",
    appId: "1:611591123678:web:a36e164bf9c58b087cc84f",
    measurementId: "G-VE60V156K4"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { auth, database, storage, db };