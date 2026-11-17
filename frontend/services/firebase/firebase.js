
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAiUB0xwr5QO-zPwKSwXglhBeJeTSI_BF4",
    authDomain: "web1-agrisim-global.firebaseapp.com",
    projectId: "web1-agrisim-global",
    storageBucket: "web1-agrisim-global.firebasestorage.app",
    messagingSenderId: "676156200632",
    appId: "1:676156200632:web:af9878d6781f6bcb30064d",
    measurementId: "G-N2S9SJX79B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
