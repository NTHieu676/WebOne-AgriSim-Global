const configData = {
    game: {
        name: "AgriSim Global",
        version: "0.1.0"
    },

    system: {
        maintenance: false
    }
};

async function getConfig() {
    return configData;
}

module.exports = {
    getConfig
};