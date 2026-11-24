const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { getCurrentProfile } = require("../controllers/playerController");

router.get("/profile", verifyToken, getCurrentProfile);

module.exports = router;
