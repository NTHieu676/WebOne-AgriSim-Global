require("dotenv").config();

const express = require("express");
const cors = require("cors");

const playerRoutes = require("./routes/playerRoutes");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
}));

app.use(express.json());

app.use("/api/player", playerRoutes);

module.exports = app;