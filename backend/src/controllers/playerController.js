const playerService = require("../services/playerService");

async function getCurrentProfile(req, res, next) {
    try {
        const result = await playerService.getOrCreateProfile(req.user);

        return res.status(200).json({
            success: true,
            data: result.player,
            meta: {
                created: result.created
            }
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getCurrentProfile
};
