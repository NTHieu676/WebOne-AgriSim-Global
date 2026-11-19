const express = require("express");

const configController = require("../controllers/configController");

const router = express.Router();

// GET /api/config
router.get("/", configController.getConfig);

module.exports = router;