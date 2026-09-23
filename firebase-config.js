// ============================================
// ZAVORA SMS — Firebase Configuration
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWZpkzhqPIvdXtKJM5HZ2-WV7ZMGtPEE4",
  authDomain: "zavorasms.firebaseapp.com",
  projectId: "zavorasms",
  storageBucket: "zavorasms.firebasestorage.app",
  messagingSenderId: "812215862269",
  appId: "1:812215862269:web:a84112fb8d7e60a3c94f94",
  measurementId: "G-ZVXMG3WW99"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, addDoc,
  query, where, orderBy, getDocs,
  serverTimestamp, increment
};
