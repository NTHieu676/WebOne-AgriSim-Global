const plotService = require("../services/plotService");

async function listPlots(req, res, next) {
    try {
        const data = await plotService.listPlots(req.user.uid);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
}

async function plant(req, res, next) {
    try {
        const data = await plotService.plant(req.user.uid, req.params.id, req.body?.requestId);
        return res.status(200).json({ success: true, data });
    } catch (error) { return next(error); }
}

async function harvest(req, res, next) {
    try {
        const data = await plotService.harvest(req.user.uid, req.params.id, req.body?.requestId);
        return res.status(200).json({ success: true, data });
    } catch (error) { return next(error); }
}

async function buyPlot(req, res, next) {
    try {
        const data = await plotService.buyPlot(req.user.uid, req.body?.requestId);
        return res.status(201).json({ success: true, data });
    } catch (error) { return next(error); }
}

module.exports = { listPlots, plant, harvest, buyPlot };
