// ==============================
// CONFIG API
// ==============================

import { apiRequest } from "./apiClient.js";

// Lấy cấu hình hệ thống
export async function getConfig() {
    return await apiRequest("/config", {
        requireAuth: false
    });
}