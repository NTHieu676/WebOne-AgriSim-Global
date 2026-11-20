import { auth } from "../firebase/firebase.js";
import { observeAuth } from "../firebase/auth.js";
import { API_BASE_URL } from "../../config/apiConfig.js";

// ==============================
// API CLIENT
// ==============================

function getAuthenticatedUser() {
    if (auth.currentUser) {
        return Promise.resolve(auth.currentUser);
    }

    return new Promise((resolve) => {
        const unsubscribe = observeAuth((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

export async function apiRequest(endpoint, options = {}) {
    const {
        requireAuth = true,
        forceTokenRefresh = false,
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
        const user = await getAuthenticatedUser();

        if (!user) {
            const error = new Error("User is not logged in");
            error.code = "AUTH_REQUIRED";
            throw error;
        }

        const token = await user.getIdToken(forceTokenRefresh);

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

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    return data;
}
