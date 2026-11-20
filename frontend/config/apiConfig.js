// ==============================
// API CONFIGURATION
// ==============================

import { API_BASE_URL as configuredApiBaseUrl } from "./runtimeConfig.js";

const localHost = window.location.hostname || "localhost";
const localApiBaseUrl = `${window.location.protocol === "https:" ? "https:" : "http:"}//${localHost}:3000/api`;
const API_BASE_URL = configuredApiBaseUrl.trim().replace(/\/$/, "") || localApiBaseUrl;

export { API_BASE_URL };
