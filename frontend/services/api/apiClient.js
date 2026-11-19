import { auth } from "../firebase/firebase.js";
import { API_BASE_URL } from "../../config/apiConfig.js";

// ==============================
// API CLIENT
// ==============================

export async function apiRequest(endpoint, options = {}) {
    const {
        requireAuth = true,
        headers = {},
        ...fetchOptions
    } = options;

    const requestHeaders = {
        "Content-Type": "application/json",
        ...headers
    };

    // ==============================
    // 1. FIREBASE AUTHENTICATION
    // ==============================

    if (requireAuth) {
        const user = auth.currentUser;

        if (!user) {
            throw new Error("User is not logged in");
        }

        const token = await user.getIdToken();

        requestHeaders.Authorization = `Bearer ${token}`;
    }

    // ==============================
    // 2. SEND REQUEST
    // ==============================

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: requestHeaders
    });

    // ==============================
    // 3. PARSE RESPONSE
    // ==============================

    const contentType = response.headers.get("content-type");

    let data = null;

    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    // ==============================
    // 4. HANDLE HTTP ERRORS
    // ==============================

    if (!response.ok) {
        const errorMessage =
            data?.message ||
            data?.error ||
            `API request failed (${response.status})`;

        throw new Error(errorMessage);
    }

    return data;
}