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

module.exports = {
    getConfig
};