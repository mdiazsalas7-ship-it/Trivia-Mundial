import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot,
  serverTimestamp, deleteDoc, collection, query, orderBy, limit, getDocs, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCd41IAwbnsJBWmNS2RefaHJuGqdbhECHU",
  authDomain: "trivia-mundial-3b4ee.firebaseapp.com",
  projectId: "trivia-mundial-3b4ee",
  storageBucket: "trivia-mundial-3b4ee.firebasestorage.app",
  messagingSenderId: "596273020649",
  appId: "1:596273020649:web:74bc5eb9d24ddafe3bfa78"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

export { db, doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, deleteDoc, collection, query, orderBy, limit, getDocs, where };
