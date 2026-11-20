require("dotenv").config();

const express = require("express");
const cors = require("cors");

const playerRoutes = require("./routes/playerRoutes");
const gameRoutes = require("./routes/gameRoutes");
const plotRoutes = require("./routes/plotRoutes");
const marketRoutes = require("./routes/marketRoutes");
const poolRoutes = require("./routes/poolRoutes");

const app = express();

const configRoutes = require("./routes/configRoutes");

// ==============================
// 1. CORS CONFIGURATION
// ==============================

const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
    console.log("Allowed Origins:", allowedOrigins);

function isAllowedOrigin(origin) {
    if (allowedOrigins.includes(origin)) return true;

    // Live Server can choose a different free port during local development.
    return process.env.NODE_ENV !== "production"
        && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.use(
    cors({
        origin: function (origin, callback) {
            // Cho phép các request không có Origin
            // (ví dụ curl, Postman hoặc server-to-server)
            if (!origin) {
                return callback(null, true);
            }

            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Origin not allowed by CORS")
            );
        }
    })
);

// ==============================
// 2. BODY PARSER
// ==============================

app.use(express.json({ limit: "1mb" }));

// ==============================
// 3. HEALTH CHECK
// ==============================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AgriSim Global API is running",
        environment: process.env.NODE_ENV || "development"
    });
});

// ==============================
// 4. API ROUTES
// ==============================

app.use("/api/player", playerRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/pool", poolRoutes);
app.use("/api/config", configRoutes);

// ==============================
// 5. 404 HANDLER
// ==============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ==============================
// 6. GLOBAL ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    // Lỗi JSON không hợp lệ
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    // Lỗi CORS
    if (err.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed"
        });
    }

    // Các lỗi khác
    const status = Number(err.status) || 500;
    res.status(status).json({
        success: false,
        // Domain services attach a 4xx status to safe, user-actionable messages.
        // Unexpected server errors stay generic so internals are not exposed.
        message: status >= 400 && status < 500 && err.message ? err.message : "Internal server error"
    });
});

module.exports = app;
