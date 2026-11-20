const { collectionReference } = require("./gameRepository");

function collection(uid) {
    return collectionReference(uid, "lots");
}

async function listInTransaction(transaction, uid) {
    return transaction.get(collection(uid));
}

function create(transaction, uid, lotId, data) {
    transaction.create(collection(uid).doc(lotId), data);
}

function update(transaction, snapshot, patch) {
    transaction.update(snapshot.ref, patch);
}

function remove(transaction, snapshot) {
    transaction.delete(snapshot.ref);
}

module.exports = { collection, listInTransaction, create, update, remove };
