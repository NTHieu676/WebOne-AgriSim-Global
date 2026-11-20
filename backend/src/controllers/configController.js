const configService = require("../services/configService");

async function getConfig(req, res, next) {
    try {
        const config = await configService.getConfig();

        return res.status(200).json({
            success: true,
            data: config
        });

    } catch (error) {
        next(error);
    }
}

async function getScenario(req, res, next) {
    try {
        const scenario = await configService.getScenario();
        return res.status(200).json({ success: true, data: scenario });
    } catch (error) {
        return next(error);
    }
}

async function getRound(req, res, next) {
    try {
        const scenarioRound = await configService.getRound(Number(req.params.round));
        return res.status(200).json({ success: true, data: scenarioRound });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getConfig,
    getScenario,
    getRound
};
