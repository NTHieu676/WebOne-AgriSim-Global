const gameRepository = require("../repositories/gameRepository");
const plotRepository = require("../repositories/plotRepository");
const lotRepository = require("../repositories/lotRepository");
const configService = require("./configService");
const { executeOnce } = require("../shared/command");
const crypto = require("crypto");

async function listPlots(uid) {
    const game = await gameRepository.getGame(uid);
    if (!game) {
        const error = new Error("Game not found");
        error.status = 404;
        throw error;
    }

    return {
        currentRound: game.currentRound,
        status: game.status,
        plots: await plotRepository.list(uid)
    };
}

async function plant(uid, plotId, requestId) {
    const simulation = (await configService.getConfig()).simulation;
    const gameReference = gameRepository.gameReference(uid);
    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, plotSnapshot] = await Promise.all([
            transaction.get(gameReference), transaction.get(plotRepository.reference(uid, plotId))
        ]);
        if (!gameSnapshot.exists || !plotSnapshot.exists) { const error = new Error("Game or plot not found"); error.status = 404; throw error; }
        const game = gameSnapshot.data();
        return executeOnce(transaction, uid, { requestId, type: "PLANT", payload: { plotId } }, async () => {
            if (game.status !== "ACTIVE" || game.currentRound > 5) { const error = new Error("Planting is unavailable"); error.status = 409; throw error; }
            if (plotSnapshot.data().status !== "EMPTY") { const error = new Error("Plot is not empty"); error.status = 409; throw error; }
            if (game.walletUsdG < simulation.PLANT_COST_USDG) { const error = new Error("Insufficient USDG"); error.status = 422; throw error; }
            const readyRound = game.currentRound + simulation.GROWTH_ROUNDS;
            plotRepository.updateGrowing(transaction, uid, plotId, { plantedRound: game.currentRound, readyRound });
            gameRepository.updateGame(transaction, uid, { walletUsdG: game.walletUsdG - simulation.PLANT_COST_USDG, version: game.version + 1 });
            gameRepository.createHistory(transaction, uid, { type: "PLANTED", round: game.currentRound, createdAt: new Date(), requestId, entityIds: [plotId], usdDelta: -simulation.PLANT_COST_USDG });
            return { plotId, readyRound, walletUsdG: game.walletUsdG - simulation.PLANT_COST_USDG };
        });
    });
}

async function harvest(uid, plotId, requestId) {
    const simulation = (await configService.getConfig()).simulation;
    const gameReference = gameRepository.gameReference(uid);
    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, plotSnapshot] = await Promise.all([
            transaction.get(gameReference), transaction.get(plotRepository.reference(uid, plotId))
        ]);
        if (!gameSnapshot.exists || !plotSnapshot.exists) { const error = new Error("Game or plot not found"); error.status = 404; throw error; }
        const game = gameSnapshot.data();
        return executeOnce(transaction, uid, { requestId, type: "HARVEST", payload: { plotId } }, async () => {
            if (game.status !== "ACTIVE") { const error = new Error("Harvesting is unavailable"); error.status = 409; throw error; }
            if (plotSnapshot.data().status !== "READY") { const error = new Error("Plot is not ready to harvest"); error.status = 409; throw error; }
            const lotId = crypto.randomUUID();
            lotRepository.create(transaction, uid, lotId, {
                asset: "RICE",
                quantity: simulation.HARVEST_YIELD_RICE,
                qualityPercent: simulation.INITIAL_QUALITY_PCT,
                region: game.startRegion,
                status: "AVAILABLE",
                source: "HARVEST",
                createdRound: game.currentRound
            });
            plotRepository.empty(transaction, uid, plotId);
            gameRepository.updateGame(transaction, uid, { version: Number(game.version || 0) + 1 });
            gameRepository.createHistory(transaction, uid, { type: "HARVESTED", round: game.currentRound, createdAt: new Date(), requestId, entityIds: [plotId, lotId], asset: "RICE", quantity: simulation.HARVEST_YIELD_RICE });
            return { plotId, lotId, quantity: simulation.HARVEST_YIELD_RICE, qualityPercent: simulation.INITIAL_QUALITY_PCT };
        });
    });
}

async function buyPlot(uid, requestId) {
    const simulation = (await configService.getConfig()).simulation;
    const gameReference = gameRepository.gameReference(uid);
    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, plotSnapshots] = await Promise.all([
            transaction.get(gameReference), plotRepository.listInTransaction(transaction, uid)
        ]);
        if (!gameSnapshot.exists) { const error = new Error("Game not found"); error.status = 404; throw error; }
        const game = gameSnapshot.data();
        return executeOnce(transaction, uid, { requestId, type: "BUY_PLOT", payload: {} }, async () => {
            if (game.status !== "ACTIVE") { const error = new Error("Buying plots is unavailable"); error.status = 409; throw error; }
            if (plotSnapshots.size >= simulation.MAX_PLOTS) { const error = new Error("Maximum number of plots reached"); error.status = 409; throw error; }
            if (game.walletUsdG < simulation.BUY_PLOT_COST_USDG) { const error = new Error("Insufficient USDG"); error.status = 422; throw error; }
            const numericIds = plotSnapshots.docs.map((snapshot) => Number(snapshot.id.replace(/^plot-/, ""))).filter(Number.isFinite);
            const plotId = `plot-${Math.max(0, ...numericIds) + 1}`;
            plotRepository.createEmpty(transaction, uid, plotId);
            const walletUsdG = game.walletUsdG - simulation.BUY_PLOT_COST_USDG;
            gameRepository.updateGame(transaction, uid, { walletUsdG, version: Number(game.version || 0) + 1 });
            gameRepository.createHistory(transaction, uid, { type: "PLOT_PURCHASED", round: game.currentRound, createdAt: new Date(), requestId, entityIds: [plotId], usdDelta: -simulation.BUY_PLOT_COST_USDG });
            return { plotId, walletUsdG, plotCount: plotSnapshots.size + 1 };
        });
    });
}

module.exports = { listPlots, plant, harvest, buyPlot };
