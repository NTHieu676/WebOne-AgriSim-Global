const {
    initializeApp,
    applicationDefault,
    cert
} = require("firebase-admin/app");

const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// Chọn phương thức xác thực theo môi trường
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Dùng JSON credentials từ biến môi trường (phù hợp deploy)
    let serviceAccount;

    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON");
    }

    credential = cert(serviceAccount);
} else {
    // Dùng ADC hoặc GOOGLE_APPLICATION_CREDENTIALS
    credential = applicationDefault();
}

// Khởi tạo Firebase Admin
const app = initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID
});

// Firestore
const db = getFirestore(app);

// Firebase Authentication
const auth = getAuth(app);

module.exports = {
    app,
    db,
    auth
};
