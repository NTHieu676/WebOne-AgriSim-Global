const express = require("express");

const configController = require("../controllers/configController");

const router = express.Router();

// GET /api/config
router.get("/", configController.getConfig);
router.get("/scenario", configController.getScenario);
router.get("/rounds/:round", configController.getRound);

module.exports = router;
