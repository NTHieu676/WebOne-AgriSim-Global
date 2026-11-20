const crypto = require("crypto");
const { Timestamp } = require("firebase-admin/firestore");
const configService = require("./configService");
const gameRepository = require("../repositories/gameRepository");
const lotRepository = require("../repositories/lotRepository");
const plotRepository = require("../repositories/plotRepository");
const shipmentRepository = require("../repositories/shipmentRepository");
const { executeOnce } = require("../shared/command");
const commandRepository = require("../repositories/commandRepository");

const REGIONS = new Set(["CHAU_A", "CHAU_AU"]);

function fail(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function startGame(uid, region) {
    if (!REGIONS.has(region)) {
        throw fail("Invalid start region", 400);
    }

    const config = await configService.getConfig();
    const simulation = config.simulation;
    const gameReference = gameRepository.gameReference(uid);
    const now = Timestamp.now();
    const generationId = crypto.randomUUID();
    const eventId = crypto.randomUUID();

    return gameRepository.runTransaction(async (transaction) => {
        const existingGame = await transaction.get(gameReference);
        if (existingGame.exists) {
            throw fail("A game already exists for this player", 409);
        }

        gameRepository.createInitialGame(transaction, {
            uid,
            generationId,
            region,
            simulation,
            now,
            eventId
        });

        return { generationId, status: "ACTIVE", currentRound: 1, startRegion: region };
    });
}

async function getCurrentGame(uid) {
    return gameRepository.getGame(uid);
}

async function getDashboard(uid) {
    return gameRepository.getDashboard(uid);
}

async function getHistory(uid, type) {
    const game = await gameRepository.getGame(uid);
    if (!game) throw fail("Game not found", 404);
    if (type && !/^[A-Z_]{3,40}$/.test(type)) throw fail("Invalid history type", 400);
    return gameRepository.getHistory(uid, type || null);
}

async function restartGame(uid, region, confirmReplace, requestId) {
    if (!REGIONS.has(region)) throw fail("Invalid start region", 400);
    if (confirmReplace !== true) throw fail("confirmReplace must be true", 400);
    const config = await configService.getConfig();
    const now = Timestamp.now(), generationId = crypto.randomUUID(), eventId = crypto.randomUUID();
    return gameRepository.runTransaction(async (transaction) => {
        const gameRef = gameRepository.gameReference(uid);
        const [gameSnap, plots, lots, pools, shipments, history, commands] = await Promise.all([
            transaction.get(gameRef),
            plotRepository.listInTransaction(transaction, uid),
            lotRepository.listInTransaction(transaction, uid),
            transaction.get(gameRepository.collectionReference(uid, "pools")),
            shipmentRepository.listInTransaction(transaction, uid),
            transaction.get(gameRepository.collectionReference(uid, "history")),
            commandRepository.listInTransaction(transaction, uid)
        ]);
        if (!gameSnap.exists) throw fail("Game not found", 404);
        if (gameSnap.data().status !== "FINISHED") throw fail("Only a finished game can be restarted", 409);
        return executeOnce(transaction, uid, { requestId, type: "RESTART_GAME", payload: { region, confirmReplace } }, async () => {
            [plots, lots, pools, shipments, history, commands].forEach((snapshots) => snapshots.docs.forEach((snapshot) => transaction.delete(snapshot.ref)));
            gameRepository.replaceInitialGame(transaction, { uid, generationId, region, simulation: config.simulation, now, eventId });
            return { generationId, status: "ACTIVE", currentRound: 1, startRegion: region };
        });
    });
}

module.exports = { startGame, getCurrentGame, getDashboard, getHistory, restartGame };
