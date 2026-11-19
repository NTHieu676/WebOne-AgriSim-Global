const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        res.json({
            message: "Authentication successful",
            uid: uid,
            email: req.user.email
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;