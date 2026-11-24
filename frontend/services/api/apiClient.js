import { auth } from "../firebase/firebase.js";
import { observeAuth } from "../firebase/auth.js";
import { API_BASE_URL } from "../../config/apiConfig.js";
import { demoRequest, isDemoSession } from "../demo/demoSession.js";

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
    // Demo never obtains a Firebase token and never sends a network request.
    // Its whole state lives in sessionStorage and is discarded with the session.
    if (isDemoSession()) return demoRequest(endpoint, options);
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

    let user = null;
    if (requireAuth) {
        user = await getAuthenticatedUser();

        if (!user) {
            const error = new Error("User is not logged in");
            error.code = "AUTH_REQUIRED";
            throw error;
        }

        const token = await user.getIdToken(forceTokenRefresh);

        requestHeaders.Authorization = `Bearer ${token}`;
    }

    const send = () => fetch(`${API_BASE_URL}${endpoint}`, { ...fetchOptions, headers: requestHeaders });
    let response = await send();

    // An ID token can be cached after a long-lived browser session. A 401 is
    // returned before the backend executes a command, so retrying once with a
    // forced Firebase refresh cannot duplicate a financial/gameplay action.
    if (response.status === 401 && requireAuth && user && !forceTokenRefresh) {
        const refreshedToken = await user.getIdToken(true);
        requestHeaders.Authorization = `Bearer ${refreshedToken}`;
        response = await send();
    }

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
