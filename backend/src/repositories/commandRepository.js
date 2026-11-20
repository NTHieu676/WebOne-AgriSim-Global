const { collectionReference } = require("./gameRepository");

function reference(uid, requestId) {
    return collectionReference(uid, "commands").doc(requestId);
}

async function getInTransaction(transaction, uid, requestId) {
    return transaction.get(reference(uid, requestId));
}

async function listInTransaction(transaction, uid) {
    return transaction.get(collectionReference(uid, "commands"));
}

function createCompleted(transaction, uid, requestId, command) {
    transaction.create(reference(uid, requestId), command);
}

module.exports = { reference, getInTransaction, listInTransaction, createCompleted };
