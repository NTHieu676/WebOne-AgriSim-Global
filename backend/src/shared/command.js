const crypto = require("crypto");
const commandRepository = require("../repositories/commandRepository");

function requireRequestId(requestId) {
    if (typeof requestId !== "string" || !/^[a-zA-Z0-9-]{8,100}$/.test(requestId)) {
        const error = new Error("A valid requestId is required");
        error.status = 400;
        throw error;
    }
}

function requestHash(payload) {
    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function executeOnce(transaction, uid, { requestId, type, payload }, work) {
    requireRequestId(requestId);
    const existing = await commandRepository.getInTransaction(transaction, uid, requestId);
    const hash = requestHash(payload);
    if (existing.exists) {
        const command = existing.data();
        if (command.type !== type || command.requestHash !== hash) {
            const error = new Error("requestId was already used with a different command");
            error.status = 409;
            throw error;
        }
        return { replayed: true, result: command.resultSummary };
    }

    const result = await work();
    commandRepository.createCompleted(transaction, uid, requestId, {
        type,
        requestHash: hash,
        status: "COMPLETED",
        resultSummary: result,
        createdAt: new Date()
    });
    return { replayed: false, result };
}

module.exports = { executeOnce, requireRequestId };
