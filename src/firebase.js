
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvXIRxcWG0hDO4hhBBDhOn2Ajgdm2nL_Y",
  authDomain: "gesmanager-cloundfs.firebaseapp.com",
  projectId: "gesmanager-cloundfs",
  storageBucket: "gesmanager-cloundfs.appspot.com",
  messagingSenderId: "711572688235",
  appId: "1:711572688235:web:63fc8bff466278655a102e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
