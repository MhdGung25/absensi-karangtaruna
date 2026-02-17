// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBj87416U0uriOGlJ0mfGDu9evY52noH9Q",
  authDomain: "absensi-rw18.firebaseapp.com",
  projectId: "absensi-rw18",
  storageBucket: "absensi-rw18.firebasestorage.app",
  messagingSenderId: "2608126779",
  appId: "1:2608126779:web:e919978b4e741e1d2df51e",
  measurementId: "G-164XGWVGE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore Database
export const db = getFirestore(app); 

// Analytics (Opsional)
export const analytics = getAnalytics(app);

export default app;