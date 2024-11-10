import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "bug-busters-firebase.firebaseapp.com",
  databaseURL: "https://bug-busters-firebase-default-rtdb.firebaseio.com",
  projectId: "bug-busters-firebase",
  storageBucket: "bug-busters-firebase.appspot.com",
  messagingSenderId: "117598043015",
  appId: "1:117598043015:web:07d5ffedc99b53d6013122",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore();
export const storage = getStorage();

// Added extra signup method using Google Authenticator
export const googleProvider = new GoogleAuthProvider();
