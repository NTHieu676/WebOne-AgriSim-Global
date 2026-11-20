const { gameReference } = require("./gameRepository");

async function list(uid) {
    const snapshots = await gameReference(uid).collection("plots").orderBy("__name__").get();
    return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
}

async function listInTransaction(transaction, uid) {
    return transaction.get(gameReference(uid).collection("plots"));
}

function reference(uid, plotId) {
    return gameReference(uid).collection("plots").doc(plotId);
}

function updateGrowing(transaction, uid, plotId, { plantedRound, readyRound }) {
    transaction.update(reference(uid, plotId), {
        status: "GROWING",
        plantedRound,
        readyRound
    });
}

function markReady(transaction, snapshot) {
    transaction.update(snapshot.ref, { status: "READY" });
}

function empty(transaction, uid, plotId) {
    transaction.update(reference(uid, plotId), {
        status: "EMPTY",
        plantedRound: null,
        readyRound: null
    });
}

function createEmpty(transaction, uid, plotId) {
    transaction.create(reference(uid, plotId), {
        status: "EMPTY",
        plantedRound: null,
        readyRound: null
    });
}

module.exports = { list, listInTransaction, reference, updateGrowing, markReady, empty, createEmpty };
