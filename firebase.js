import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDGpIdziS77byUeWAU0o-mIF7U9ChYiqZw",
    authDomain: "cumpliendo-suenos-8b0ad.firebaseapp.com",
    databaseURL: "https://cumpliendo-suenos-8b0ad-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cumpliendo-suenos-8b0ad",
    storageBucket: "cumpliendo-suenos-8b0ad.firebasestorage.app",
    messagingSenderId: "77948454376",
    appId: "1:77948454376:web:954ce3ea9c50ef4b4b505d"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };