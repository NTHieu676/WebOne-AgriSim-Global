const { auth } = require("../config/firebaseAdmin");

// Middleware xác thực người dùng
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // Kiểm tra Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Missing token"
            });
        }

        // Lấy Firebase ID Token
        const token = authHeader.split(" ")[1];

        // Xác minh token
        const decodedToken = await auth.verifyIdToken(token);

        // Lưu thông tin người dùng vào request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || null
        };

        next();
    } catch (error) {
        // Keep the client response generic, but preserve the actionable
        // Firebase Admin diagnostic in server logs for local troubleshooting.
        console.error("Firebase token verification failed:", error.code || "UNKNOWN", error.message);
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token"
        });
    }
}

module.exports = {
    verifyToken
};
