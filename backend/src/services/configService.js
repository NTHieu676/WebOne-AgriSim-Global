const configRepository = require("../repositories/configRepository");

async function getConfig() {
    const config = await configRepository.getConfig();

    if (!config) {
        throw new Error("Configuration data not found");
    }

    return config;
}

module.exports = {
    getConfig
};