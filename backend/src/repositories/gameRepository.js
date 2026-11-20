const { db } = require("../config/firebaseAdmin");

function gameReference(uid) {
    return db.collection("games").doc(uid);
}

function collectionReference(uid, collectionName) {
    return gameReference(uid).collection(collectionName);
}

function documentReference(uid, collectionName, documentId) {
    return collectionReference(uid, collectionName).doc(documentId);
}

async function getGame(uid) {
    const snapshot = await gameReference(uid).get();
    return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

function serializeDocument(snapshot) {
    return { id: snapshot.id, ...snapshot.data() };
}

async function getDashboard(uid) {
    const game = await getGame(uid);
    if (!game) return null;

    const reference = gameReference(uid);
    const [plots, lots, pools, shipments, history] = await Promise.all([
        reference.collection("plots").get(),
        reference.collection("lots").get(),
        reference.collection("pools").get(),
        reference.collection("shipments").get(),
        reference.collection("history").orderBy("createdAt", "desc").limit(5).get()
    ]);

    return {
        game,
        plots: plots.docs.map(serializeDocument),
        lots: lots.docs.map(serializeDocument),
        pools: pools.docs.map(serializeDocument),
        shipments: shipments.docs.map(serializeDocument),
        recentHistory: history.docs.map(serializeDocument)
    };
}

async function getHistory(uid, type) {
    let query = collectionReference(uid, "history").orderBy("createdAt", "desc").limit(100);
    const snapshots = await query.get();
    const events = snapshots.docs.map(serializeDocument);
    return type ? events.filter((event) => event.type === type) : events;
}

async function runTransaction(work) {
    return db.runTransaction(work);
}

function createInitialGame(transaction, { uid, generationId, region, simulation, now, eventId }) {
    const reference = gameReference(uid);
    transaction.create(reference, {
        uid,
        generationId,
        status: "ACTIVE",
        currentRound: 1,
        startRegion: region,
        walletUsdG: simulation.INITIAL_USDG,
        totalTopups: 0,
        startedAt: now,
        finishedAt: null,
        version: 1,
        summarySnapshot: null
    });
    transaction.create(documentReference(uid, "plots", "plot-1"), {
        status: "EMPTY",
        plantedRound: null,
        readyRound: null
    });
    transaction.create(documentReference(uid, "pools", "RICE"), {
        asset: "RICE",
        assetReserve: simulation.INITIAL_RICE_POOL.assetReserve,
        usdgReserve: simulation.INITIAL_RICE_POOL.usdgReserve,
        feeRate: simulation.SWAP_FEE_RATE,
        version: 1
    });
    transaction.create(documentReference(uid, "pools", "GOLD"), {
        asset: "GOLD",
        assetReserve: simulation.INITIAL_GOLD_POOL.assetReserve,
        usdgReserve: simulation.INITIAL_GOLD_POOL.usdgReserve,
        feeRate: simulation.SWAP_FEE_RATE,
        version: 1
    });
    transaction.create(documentReference(uid, "history", eventId), {
        type: "GAME_STARTED",
        round: 1,
        createdAt: now,
        details: { generationId, startRegion: region }
    });
}

function replaceInitialGame(transaction, { uid, generationId, region, simulation, now, eventId }) {
    const reference = gameReference(uid);
    transaction.set(reference, {
        uid,
        generationId,
        status: "ACTIVE",
        currentRound: 1,
        startRegion: region,
        walletUsdG: simulation.INITIAL_USDG,
        totalTopups: 0,
        startedAt: now,
        finishedAt: null,
        version: 1,
        summarySnapshot: null
    });
    transaction.create(documentReference(uid, "plots", "plot-1"), { status: "EMPTY", plantedRound: null, readyRound: null });
    transaction.create(documentReference(uid, "pools", "RICE"), { asset: "RICE", assetReserve: simulation.INITIAL_RICE_POOL.assetReserve, usdgReserve: simulation.INITIAL_RICE_POOL.usdgReserve, feeRate: simulation.SWAP_FEE_RATE, version: 1 });
    transaction.create(documentReference(uid, "pools", "GOLD"), { asset: "GOLD", assetReserve: simulation.INITIAL_GOLD_POOL.assetReserve, usdgReserve: simulation.INITIAL_GOLD_POOL.usdgReserve, feeRate: simulation.SWAP_FEE_RATE, version: 1 });
    transaction.create(documentReference(uid, "history", eventId), { type: "GAME_STARTED", round: 1, createdAt: now, details: { generationId, startRegion: region } });
}

function createHistory(transaction, uid, event) {
    transaction.create(collectionReference(uid, "history").doc(), event);
}

function updateGame(transaction, uid, patch) {
    transaction.update(gameReference(uid), patch);
}

module.exports = {
    gameReference,
    collectionReference,
    documentReference,
    getGame,
    getDashboard,
    getHistory,
    runTransaction,
    createInitialGame,
    replaceInitialGame,
    createHistory,
    updateGame
};
