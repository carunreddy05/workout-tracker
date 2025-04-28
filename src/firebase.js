// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAci5d5bg_OI_xZdYAmxf4jftAxnj2dxHI",
    authDomain: "gymentrytracker.firebaseapp.com",
    projectId: "gymentrytracker",
    storageBucket: "gymentrytracker.firebasestorage.app",
    messagingSenderId: "566313471543",
    appId: "1:566313471543:web:d1dafa9e7f1a664d15f9b2"
  };  
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore database
export const db = getFirestore(app);
