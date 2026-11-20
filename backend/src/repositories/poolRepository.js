const { collectionReference } = require("./gameRepository");
function reference(uid, asset) { return collectionReference(uid, "pools").doc(asset); }
function update(transaction, uid, asset, patch) { transaction.update(reference(uid, asset), patch); }
module.exports = { reference, update };
