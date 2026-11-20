const gameRepository = require("../repositories/gameRepository");
const { executeOnce } = require("../shared/command");

function fail(message, status) { const error = new Error(message); error.status = status; return error; }

async function topup(uid, amount, requestId) {
  if (!Number.isInteger(amount) || amount < 100 || amount > 5000) throw fail("Top-up amount must be an integer from 100 to 5000", 400);
  return gameRepository.runTransaction(async (transaction) => {
    const gameRef = gameRepository.gameReference(uid);
    const gameSnap = await transaction.get(gameRef);
    if (!gameSnap.exists) throw fail("Game not found", 404);
    const game = gameSnap.data();
    return executeOnce(transaction, uid, { requestId, type: "TOP_UP", payload: { amount } }, async () => {
      if (game.status !== "ACTIVE") throw fail("Top-up is only available for an active game", 409);
      const walletUsdG = Number(game.walletUsdG) + amount;
      const totalTopups = Number(game.totalTopups || 0) + amount;
      gameRepository.updateGame(transaction, uid, { walletUsdG, totalTopups, version: Number(game.version || 0) + 1 });
      gameRepository.createHistory(transaction, uid, { type: "TOPPED_UP", round: game.currentRound, createdAt: new Date(), requestId, usdDelta: amount, details: { amount } });
      return { amount, walletUsdG, totalTopups };
    });
  });
}

module.exports = { topup };
