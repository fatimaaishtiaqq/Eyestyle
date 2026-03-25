import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration provided by the user
const firebaseConfig = {
    apiKey: "AIzaSyC6Slvb9drp1o_o7aaJx4TppAZyEK0Qq5s",
    authDomain: "eyestyle-01.firebaseapp.com",
    projectId: "eyestyle-01",
    storageBucket: "eyestyle-01.firebasestorage.app",
    messagingSenderId: "170937743864",
    appId: "1:170937743864:web:9fb662668a357cfec87e0d",
    measurementId: "G-KW7V9ZCVNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
