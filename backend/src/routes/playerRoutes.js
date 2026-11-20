const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const { getCurrentProfile } = require("../controllers/playerController");

router.get("/profile", verifyToken, getCurrentProfile);

module.exports = router;
