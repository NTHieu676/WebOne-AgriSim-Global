const gameService = require("../services/gameService");
const roundService = require("../services/roundService");
const summaryService = require("../services/summaryService");
const topupService = require("../services/topupService");

async function startGame(req, res, next) {
    try {
        const game = await gameService.startGame(req.user.uid, req.body?.region);
        return res.status(201).json({ success: true, data: game });
    } catch (error) {
        return next(error);
    }
}

async function getCurrentGame(req, res, next) {
    try {
        const game = await gameService.getCurrentGame(req.user.uid);
        return res.status(200).json({ success: true, data: game });
    } catch (error) {
        return next(error);
    }
}

async function getDashboard(req, res, next) {
    try {
        const dashboard = await gameService.getDashboard(req.user.uid);
        return res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
        return next(error);
    }
}
async function getHistory(req, res, next) {
    try { const data = await gameService.getHistory(req.user.uid, req.query?.type); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); }
}

async function advanceRound(req, res, next) {
    try {
        const data = await roundService.advance(req.user.uid, req.body?.expectedRound, req.body?.requestId);
        return res.status(200).json({ success: true, data });
    } catch (error) { return next(error); }
}
async function finishGame(req, res, next) {
    try { const data = await summaryService.finish(req.user.uid, req.body?.expectedRound, req.body?.requestId); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); }
}
async function getSummary(req, res, next) {
    try { const data = await summaryService.getSummary(req.user.uid); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); }
}
async function restartGame(req, res, next) {
    try { const data = await gameService.restartGame(req.user.uid, req.body?.region, req.body?.confirmReplace, req.body?.requestId); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); }
}
async function topup(req, res, next) {
    try { const data = await topupService.topup(req.user.uid, req.body?.amount, req.body?.requestId); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); }
}

module.exports = { startGame, getCurrentGame, getDashboard, getHistory, advanceRound, finishGame, getSummary, restartGame, topup };
