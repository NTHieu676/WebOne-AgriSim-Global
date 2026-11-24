const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { listPlots, plant, harvest, buyPlot } = require("../controllers/plotController");

const router = express.Router();
router.get("/", verifyToken, listPlots);
router.post("/:id/plant", verifyToken, plant);
router.post("/:id/harvest", verifyToken, harvest);
router.post("/buy", verifyToken, buyPlot);

module.exports = router;
