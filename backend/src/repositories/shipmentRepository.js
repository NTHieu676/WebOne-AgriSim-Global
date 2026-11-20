const { collectionReference } = require("./gameRepository");

function collection(uid) {
    return collectionReference(uid, "shipments");
}

async function listInTransaction(transaction, uid) {
    return transaction.get(collection(uid));
}

function update(transaction, snapshot, patch) {
    transaction.update(snapshot.ref, patch);
}

function create(transaction, uid, shipmentId, data) {
    transaction.create(collection(uid).doc(shipmentId), data);
}

module.exports = { collection, listInTransaction, update, create };
