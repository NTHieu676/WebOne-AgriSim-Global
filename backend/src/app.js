require("dotenv").config();

const express = require("express");
const cors = require("cors");

const playerRoutes = require("./routes/playerRoutes");

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

app.use(
    cors({
        origin: function (origin, callback) {
            // Cho phép các request không có Origin
            // (ví dụ curl, Postman hoặc server-to-server)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
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
    res.status(err.status || 500).json({
        success: false,
        message: "Internal server error"
    });
});

module.exports = app;