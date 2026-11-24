const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { sell, ship } = require("../controllers/marketController");

const router = express.Router();
router.post("/lots/:id/sell", verifyToken, sell);
router.post("/lots/:id/ship", verifyToken, ship);

module.exports = router;
