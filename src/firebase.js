// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "movie-app-8e7ba.firebaseapp.com",
  projectId: "movie-app-8e7ba",
  storageBucket: "movie-app-8e7ba.firebasestorage.app",
  messagingSenderId: "203099932423",
  appId: "1:203099932423:web:eedfa0d172e3ebf61ea7a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get auth instance
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, db};
