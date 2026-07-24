import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * [Layer 3 - Infrastructure] Firebase 연동
 */
const firebaseConfig = {
    apiKey: "AIzaSyDIZvVh0gDQ9BcNWYyBfLv7aOdUr95DVhI",
    authDomain: "quests-4a423.firebaseapp.com",
    projectId: "quests-4a423",
    storageBucket: "quests-4a423.firebasestorage.app",
    messagingSenderId: "159146792304",
    appId: "1:159146792304:web:f85979daf01eade2196bb5",
    measurementId: "G-MBKE528EHT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
