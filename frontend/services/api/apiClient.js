import { auth } from "../firebase/firebase.js";

const API_URL = "http://localhost:3000/api";

export async function apiRequest(endpoint, options = {}) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User is not logged in");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "API request failed");
    }

    return data;
}