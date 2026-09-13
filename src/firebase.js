import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAS6zrYkoFm0BHb3Z2X1ujuug2NPBrzurs",
  authDomain: "timbermart-fbad0.firebaseapp.com",
  projectId: "timbermart-fbad0",
  storageBucket: "timbermart-fbad0.firebasestorage.app",
  messagingSenderId: "410138765047",
  appId: "1:410138765047:web:667b641f2d0470b4ced5f2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;