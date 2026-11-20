const crypto = require("crypto");
const gameRepository = require("../repositories/gameRepository");
const poolRepository = require("../repositories/poolRepository");
const lotRepository = require("../repositories/lotRepository");
const { executeOnce } = require("../shared/command");

const SCALE = 100000000n;
const FEE_SCALE = 100000000n;
function fixed(value) {
  const source = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(source)) throw fail("Invalid decimal value", 400);
  const [whole, fraction = ""] = source.split(".");
  if (fraction.length > 8) throw fail("Decimal values support at most 8 fractional digits", 400);
  return BigInt(whole) * SCALE + BigInt((fraction + "00000000").slice(0, 8));
}
function asNumber(value) { return Number(value) / Number(SCALE); }
function rate(value) { return fixed(value); }
function fail(message, status) { const error = new Error(message); error.status = status; return error; }
function quote(pool, direction, quantityIn) {
  const input = fixed(quantityIn), feeRate = rate(pool.feeRate), x = fixed(pool.assetReserve), y = fixed(pool.usdgReserve);
  if (input <= 0n) throw fail("quantityIn must be greater than zero", 400);
  const fee = input * feeRate / FEE_SCALE, effective = input - fee;
  const amountOut = direction === "BUY" ? x * effective / (y + effective) : y * effective / (x + effective);
  if (amountOut <= 0n || (direction === "BUY" && amountOut >= x) || (direction === "SELL" && amountOut >= y)) throw fail("Insufficient pool liquidity", 422);
  const poolPriceBefore = y * SCALE / x;
  const executionPrice = direction === "BUY" ? input * SCALE / amountOut : amountOut * SCALE / input;
  return { quantityIn: asNumber(input), fee: asNumber(fee), amountOut: asNumber(amountOut), poolPriceBefore: asNumber(poolPriceBefore), executionPrice: asNumber(executionPrice) };
}
function validateParameters({ asset, direction, quantityIn }) {
  if (!["RICE", "GOLD"].includes(asset) || !["BUY", "SELL"].includes(direction)) throw fail("Invalid swap parameters", 400);
  if (fixed(quantityIn) <= 0n) throw fail("quantityIn must be greater than zero", 400);
}
function validateLot(lot, asset, amount) {
  if (!lot || lot.asset !== asset || lot.status !== "AVAILABLE" || amount > fixed(lot.quantity) || (asset === "RICE" && Number(lot.qualityPercent) !== 100)) {
    throw fail("Lot is not eligible for this swap", 422);
  }
}
async function preview(uid, { asset, direction, quantityIn, lotId, targetRegion }) {
  validateParameters({ asset, direction, quantityIn });
  const [gameSnap, poolSnap, lotSnap] = await Promise.all([
    gameRepository.gameReference(uid).get(),
    poolRepository.reference(uid, asset).get(),
    direction === "SELL" ? lotRepository.collection(uid).doc(lotId || "").get() : Promise.resolve(null)
  ]);
  if (!gameSnap.exists || !poolSnap.exists) throw fail("Game or pool not found", 404);
  const game = gameSnap.data(), amount = fixed(quantityIn);
  if (game.status !== "ACTIVE") throw fail("Swapping is unavailable", 409);
  if (direction === "BUY") {
    if (!["CHAU_A", "CHAU_AU"].includes(targetRegion)) throw fail("A target region is required", 400);
    if (fixed(game.walletUsdG) < amount) throw fail("Insufficient USDG", 422);
  } else {
    validateLot(lotSnap?.exists ? lotSnap.data() : null, asset, amount);
  }
  const result = quote(poolSnap.data(), direction, amount);
  return { asset, direction, ...result, walletUsdG: Number(game.walletUsdG), targetRegion: targetRegion || null };
}
async function swap(uid, { asset, direction, quantityIn, lotId, targetRegion, requestId }) {
  validateParameters({ asset, direction, quantityIn });
  const gameRef = gameRepository.gameReference(uid), poolRef = poolRepository.reference(uid, asset), lotRef = direction === "SELL" ? lotRepository.collection(uid).doc(lotId || "") : null;
  return gameRepository.runTransaction(async (transaction) => {
    const reads = [transaction.get(gameRef), transaction.get(poolRef)]; if (lotRef) reads.push(transaction.get(lotRef));
    const [gameSnap, poolSnap, lotSnap] = await Promise.all(reads);
    if (!gameSnap.exists || !poolSnap.exists) throw fail("Game or pool not found", 404);
    const game = gameSnap.data(), pool = poolSnap.data(), amount = fixed(quantityIn);
    return executeOnce(transaction, uid, { requestId, type: "SWAP", payload: { asset, direction, quantityIn: asNumber(amount), lotId: lotId || null, targetRegion: targetRegion || null } }, async () => {
      if (game.status !== "ACTIVE") throw fail("Swapping is unavailable", 409);
      if (direction === "BUY") { if (!["CHAU_A", "CHAU_AU"].includes(targetRegion)) throw fail("A target region is required", 400); if (fixed(game.walletUsdG) < amount) throw fail("Insufficient USDG", 422); }
      else { if (!lotSnap?.exists) throw fail("Lot not found", 404); validateLot(lotSnap.data(), asset, amount); }
      const result = quote(pool, direction, amount);
      const assetReserve = fixed(pool.assetReserve), usdgReserve = fixed(pool.usdgReserve), output = fixed(result.amountOut);
      const reserves = direction === "BUY" ? { assetReserve: asNumber(assetReserve - output), usdgReserve: asNumber(usdgReserve + amount) } : { assetReserve: asNumber(assetReserve + amount), usdgReserve: asNumber(usdgReserve - output) };
      poolRepository.update(transaction, uid, asset, { ...reserves, version: Number(pool.version || 0) + 1 });
      let wallet = fixed(game.walletUsdG);
      if (direction === "BUY") { wallet -= amount; lotRepository.create(transaction, uid, crypto.randomUUID(), { asset, quantity: result.amountOut, qualityPercent: 100, region: targetRegion, status: "AVAILABLE", source: "SWAP", createdRound: game.currentRound }); }
      else { const remaining = fixed(lotSnap.data().quantity) - amount; if (remaining === 0n) lotRepository.remove(transaction, lotSnap); else lotRepository.update(transaction, lotSnap, { quantity: asNumber(remaining) }); wallet += output; }
      const walletUsdG = asNumber(wallet);
      gameRepository.updateGame(transaction, uid, { walletUsdG, version: Number(game.version || 0) + 1 });
      const swapFeeUsdEquivalent = direction === "BUY" ? result.fee : asNumber(fixed(result.fee) * fixed(result.poolPriceBefore) / SCALE);
      gameRepository.createHistory(transaction, uid, { type: "SWAPPED", round: game.currentRound, createdAt: new Date(), requestId, asset, quantity: asNumber(amount), usdDelta: direction === "BUY" ? -asNumber(amount) : result.amountOut, swapFeeUsdEquivalent, details: { direction, ...result } });
      return { asset, direction, ...result, walletUsdG, reserves };
    });
  });
}
module.exports = { quote, preview, swap };
