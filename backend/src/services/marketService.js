const gameRepository = require("../repositories/gameRepository");
const lotRepository = require("../repositories/lotRepository");
const shipmentRepository = require("../repositories/shipmentRepository");
const configService = require("./configService");
const { executeOnce } = require("../shared/command");

function fail(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function sell(uid, lotId, quantity, requestId) {
    if (!Number.isFinite(quantity) || quantity <= 0) throw fail("quantity must be greater than zero", 400);
    const gameReference = gameRepository.gameReference(uid);
    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, lotSnapshot] = await Promise.all([
            transaction.get(gameReference), transaction.get(lotRepository.collection(uid).doc(lotId))
        ]);
        if (!gameSnapshot.exists || !lotSnapshot.exists) throw fail("Game or lot not found", 404);
        const game = gameSnapshot.data();
        const lot = lotSnapshot.data();
        return executeOnce(transaction, uid, { requestId, type: "SELL", payload: { lotId, quantity } }, async () => {
            if (game.status !== "ACTIVE") throw fail("Selling is unavailable", 409);
            if (lot.status !== "AVAILABLE" || Number(lot.qualityPercent) <= 0) throw fail("This lot cannot be sold", 409);
            if (quantity > Number(lot.quantity)) throw fail("Quantity exceeds the available lot", 422);
            const scenario = await configService.getRound(game.currentRound);
            const price = scenario.prices?.[lot.asset]?.[lot.region];
            if (!Number.isFinite(price)) throw fail("Market price is unavailable", 500);
            const revenue = quantity * price * Number(lot.qualityPercent) / 100;
            const remaining = Number(lot.quantity) - quantity;
            if (remaining === 0) lotRepository.remove(transaction, lotSnapshot);
            else lotRepository.update(transaction, lotSnapshot, { quantity: remaining });
            const walletUsdG = Number(game.walletUsdG) + revenue;
            gameRepository.updateGame(transaction, uid, { walletUsdG, version: Number(game.version || 0) + 1 });
            gameRepository.createHistory(transaction, uid, { type: "SOLD", round: game.currentRound, createdAt: new Date(), requestId, entityIds: [lotId], asset: lot.asset, quantity, usdDelta: revenue, details: { region: lot.region, price, qualityPercent: lot.qualityPercent } });
            return { lotId, quantity, revenue, walletUsdG, remaining };
        });
    });
}

async function ship(uid, lotId, quantity, destination, requestId) {
    if (!Number.isFinite(quantity) || quantity <= 0) throw fail("quantity must be greater than zero", 400);
    if (!["CHAU_A", "CHAU_AU"].includes(destination)) throw fail("Invalid destination", 400);
    const gameReference = gameRepository.gameReference(uid);
    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, lotSnapshot] = await Promise.all([
            transaction.get(gameReference), transaction.get(lotRepository.collection(uid).doc(lotId))
        ]);
        if (!gameSnapshot.exists || !lotSnapshot.exists) throw fail("Game or lot not found", 404);
        const game = gameSnapshot.data(); const lot = lotSnapshot.data();
        return executeOnce(transaction, uid, { requestId, type: "SHIP", payload: { lotId, quantity, destination } }, async () => {
            if (game.status !== "ACTIVE" || game.currentRound > 5) throw fail("Shipping is unavailable", 409);
            if (lot.status !== "AVAILABLE" || Number(lot.qualityPercent) <= 0 || quantity > Number(lot.quantity)) throw fail("This lot cannot be shipped in that quantity", 422);
            if (lot.region === destination) throw fail("Destination must differ from the lot region", 400);
            const scenario = await configService.getRound(game.currentRound);
            const { simulation } = await configService.getConfig();
            const unitCost = Number.isFinite(Number(simulation?.SHIPPING_COST_PER_UNIT)) ? Number(simulation.SHIPPING_COST_PER_UNIT) : 0.5;
            const shippingFeeUsd = quantity * unitCost * scenario.shippingMultiplier;
            if (Number(game.walletUsdG) < shippingFeeUsd) throw fail("Insufficient USDG for shipping", 422);
            const remaining = Number(lot.quantity) - quantity;
            if (remaining === 0) lotRepository.remove(transaction, lotSnapshot); else lotRepository.update(transaction, lotSnapshot, { quantity: remaining });
            const shipmentId = require("crypto").randomUUID();
            shipmentRepository.create(transaction, uid, shipmentId, { asset: lot.asset, quantity, qualityPercent: lot.qualityPercent, origin: lot.region, destination, sentRound: game.currentRound, arrivalRound: game.currentRound + 1, shippingFeeUsd, status: "IN_TRANSIT", arrivedLotId: null });
            const walletUsdG = Number(game.walletUsdG) - shippingFeeUsd;
            gameRepository.updateGame(transaction, uid, { walletUsdG, version: Number(game.version || 0) + 1 });
            gameRepository.createHistory(transaction, uid, { type: "SHIPPED", round: game.currentRound, createdAt: new Date(), requestId, entityIds: [lotId, shipmentId], asset: lot.asset, quantity, usdDelta: -shippingFeeUsd, shipmentFeeUsd: shippingFeeUsd, details: { origin: lot.region, destination, arrivalRound: game.currentRound + 1, shippingFeeUsd } });
            return { shipmentId, shippingFeeUsd, arrivalRound: game.currentRound + 1, walletUsdG };
        });
    });
}

module.exports = { sell, ship };
