import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkTJRJbeLHndQbUy-S4essAFrTpJ-n_wM",
  authDomain: "appcarroceriasbolcato.firebaseapp.com",
  projectId: "appcarroceriasbolcato",
  storageBucket: "appcarroceriasbolcato.firebasestorage.app",
  messagingSenderId: "696624245832",
  appId: "1:696624245832:web:4358a7f5ae287d4b3fbc7d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();