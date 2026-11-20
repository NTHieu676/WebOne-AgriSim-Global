import { auth } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

// Firebase Authentication is solely responsible for passwords.
export async function register(displayName, email, password) {
    const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    await updateProfile(result.user, { displayName });

    return result.user;
}

// Login
export async function login(email, password) {
    const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return result.user;
}

// Logout
export async function logout() {
    await signOut(auth);
}

// Observe authentication state
export function observeAuth(callback) {
    return onAuthStateChanged(auth, callback);
}
