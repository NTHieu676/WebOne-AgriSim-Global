const { Timestamp } = require("firebase-admin/firestore");
const gameRepository = require("../repositories/gameRepository");
const lotRepository = require("../repositories/lotRepository");
const configService = require("./configService");
const { executeOnce } = require("../shared/command");

const COUNTED_TYPES = new Set(["PLANTED", "HARVESTED", "PLOT_PURCHASED", "SWAPPED", "SOLD", "SHIPPED"]);

function fail(message, status) { const error = new Error(message); error.status = status; return error; }
function round8(value) { return Math.round((Number(value) + Number.EPSILON) * 1e8) / 1e8; }

function buildSnapshot(game, lots, history, prices) {
  const remainingLots = lots
    .filter((lot) => lot.status === "AVAILABLE" && Number(lot.quantity) > 0 && Number(lot.qualityPercent) > 0)
    .map((lot) => ({ id: lot.id, asset: lot.asset, quantity: Number(lot.quantity), qualityPercent: Number(lot.qualityPercent), region: lot.region }));
  const warehouseValue = remainingLots.reduce((total, lot) => {
    const price = Number(prices?.[lot.asset]?.[lot.region]);
    return total + (Number.isFinite(price) ? lot.quantity * price * lot.qualityPercent / 100 : 0);
  }, 0);
  const totalSwapFeesUsdEquivalent = history.filter((event) => event.type === "SWAPPED").reduce((total, event) => total + Number(event.swapFeeUsdEquivalent || 0), 0);
  const totalShippingFeesUsd = history.filter((event) => event.type === "SHIPPED").reduce((total, event) => total + Number(event.shipmentFeeUsd || 0), 0);
  const walletUsdG = Number(game.walletUsdG);
  const endNetWorth = round8(walletUsdG + warehouseValue);
  return {
    walletUsdG,
    remainingLots,
    totalTopups: Number(game.totalTopups || 0),
    warehouseValue: round8(warehouseValue),
    endNetWorth,
    netChange: round8(endNetWorth - (2000 + Number(game.totalTopups || 0))),
    totalSwapFeesUsdEquivalent: round8(totalSwapFeesUsdEquivalent),
    totalShippingFeesUsd: round8(totalShippingFeesUsd),
    transactionCount: history.filter((event) => COUNTED_TYPES.has(event.type)).length
  };
}

async function finish(uid, expectedRound, requestId) {
  if (expectedRound !== 6) throw fail("expectedRound must be 6", 400);
  const scenario = await configService.getRound(6);
  return gameRepository.runTransaction(async (transaction) => {
    const gameRef = gameRepository.gameReference(uid);
    const [gameSnap, lotSnaps, historySnaps] = await Promise.all([
      transaction.get(gameRef),
      lotRepository.listInTransaction(transaction, uid),
      transaction.get(gameRepository.collectionReference(uid, "history"))
    ]);
    if (!gameSnap.exists) throw fail("Game not found", 404);
    const game = gameSnap.data();
    return executeOnce(transaction, uid, { requestId, type: "FINISH_GAME", payload: { expectedRound } }, async () => {
      if (game.status !== "ACTIVE" || game.currentRound !== 6) throw fail("Only an active game at round 6 can be finished", 409);
      const summarySnapshot = buildSnapshot(game, lotSnaps.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() })), historySnaps.docs.map((snapshot) => snapshot.data()), scenario.prices);
      const finishedAt = Timestamp.now();
      gameRepository.updateGame(transaction, uid, { status: "FINISHED", finishedAt, summarySnapshot, version: Number(game.version || 0) + 1 });
      gameRepository.createHistory(transaction, uid, { type: "GAME_FINISHED", round: 6, createdAt: finishedAt, requestId, details: { endNetWorth: summarySnapshot.endNetWorth } });
      return summarySnapshot;
    });
  });
}

async function getSummary(uid) {
  const game = await gameRepository.getGame(uid);
  if (!game) throw fail("Game not found", 404);
  if (game.status !== "FINISHED" || !game.summarySnapshot) throw fail("The game has not been finished", 409);
  return game.summarySnapshot;
}

module.exports = { buildSnapshot, finish, getSummary };
