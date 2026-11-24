const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { startGame, getCurrentGame, getDashboard, getHistory, advanceRound, finishGame, getSummary, restartGame, topup } = require("../controllers/gameController");

const router = express.Router();

router.get("/", verifyToken, getCurrentGame);
router.get("/dashboard", verifyToken, getDashboard);
router.get("/history", verifyToken, getHistory);
router.post("/start", verifyToken, startGame);
router.post("/advance", verifyToken, advanceRound);
router.post("/finish", verifyToken, finishGame);
router.get("/summary", verifyToken, getSummary);
router.post("/restart", verifyToken, restartGame);
router.post("/topup", verifyToken, topup);

module.exports = router;
