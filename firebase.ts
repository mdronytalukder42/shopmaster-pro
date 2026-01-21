
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Added Auth

const firebaseConfig = {
  apiKey: "AIzaSyAB5LWTxHXSKAzH9PH7Exhcdm-KqdRlhC8",
  authDomain: "anower-telecom-shope.firebaseapp.com",
  projectId: "anower-telecom-shope",
  storageBucket: "anower-telecom-shope.firebasestorage.app",
  messagingSenderId: "1076470910187",
  appId: "1:1076470910187:web:a89368ea525c684a8182ae",
  measurementId: "G-N3133FRZ3S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Export Auth for login
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
