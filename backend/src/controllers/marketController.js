const marketService = require("../services/marketService");

async function sell(req, res, next) {
    try {
        const data = await marketService.sell(req.user.uid, req.params.id, Number(req.body?.quantity), req.body?.requestId);
        return res.status(200).json({ success: true, data });
    } catch (error) { return next(error); }
}

async function ship(req, res, next) {
    try {
        const data = await marketService.ship(req.user.uid, req.params.id, Number(req.body?.quantity), req.body?.destination, req.body?.requestId);
        return res.status(201).json({ success: true, data });
    } catch (error) { return next(error); }
}

module.exports = { sell, ship };
