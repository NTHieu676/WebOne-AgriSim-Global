const configRepository = require("../repositories/configRepository");

async function getConfig() {
    const config = await configRepository.getConfig();

    if (!config) {
        throw new Error("Configuration data not found");
    }

    return config;
}

async function getScenario() {
    return configRepository.getScenario();
}

async function getRound(round) {
    if (!Number.isInteger(round) || round < 1 || round > 6) {
        const error = new Error("Round must be an integer from 1 to 6");
        error.status = 400;
        throw error;
    }

    const scenarioRound = configRepository.getRound(round);
    if (!scenarioRound) {
        const error = new Error("Scenario round not found");
        error.status = 404;
        throw error;
    }

    return scenarioRound;
}

module.exports = {
    getConfig,
    getScenario,
    getRound
};
