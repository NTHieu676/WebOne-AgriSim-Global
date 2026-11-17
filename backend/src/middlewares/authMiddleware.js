const { auth } = require("../config/firebaseAdmin");

async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify Firebase ID Token
        const decodedToken = await auth.verifyIdToken(token);

        req.user = decodedToken;

        next();

    } catch (error) {
        console.error("Token verification error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = verifyToken;