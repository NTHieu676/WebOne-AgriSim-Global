const playerRepository = require("../repositories/playerRepository");

async function getOrCreateProfile(authenticatedUser) {
    const { uid, email = null, name = null } = authenticatedUser;

    if (!uid || typeof uid !== "string") {
        const error = new Error("Authenticated user is missing a UID");
        error.status = 401;
        throw error;
    }

    return playerRepository.createIfMissing({
        uid,
        email,
        displayName: name
    });
}

module.exports = {
    getOrCreateProfile
};
