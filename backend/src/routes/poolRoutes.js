const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const { preview, swap } = require("../controllers/poolController");
const router = express.Router();
router.post("/quote", verifyToken, preview);
router.post("/swap", verifyToken, swap);
module.exports = router;
