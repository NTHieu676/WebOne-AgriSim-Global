const crypto = require("crypto");
const gameRepository = require("../repositories/gameRepository");
const plotRepository = require("../repositories/plotRepository");
const lotRepository = require("../repositories/lotRepository");
const shipmentRepository = require("../repositories/shipmentRepository");
const configService = require("./configService");
const { executeOnce } = require("../shared/command");

function fail(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function decayedQuality(asset, qualityPercent, loss) {
    return asset === "RICE" ? Math.max(0, Number(qualityPercent) - loss) : 100;
}

async function advance(uid, expectedRound, requestId) {
    if (!Number.isInteger(expectedRound)) throw fail("expectedRound must be an integer", 400);
    const simulation = (await configService.getConfig()).simulation;

    return gameRepository.runTransaction(async (transaction) => {
        const [gameSnapshot, plotSnapshots, lotSnapshots, shipmentSnapshots] = await Promise.all([
            transaction.get(gameRepository.gameReference(uid)),
            plotRepository.listInTransaction(transaction, uid),
            lotRepository.listInTransaction(transaction, uid),
            shipmentRepository.listInTransaction(transaction, uid)
        ]);
        if (!gameSnapshot.exists) throw fail("Game not found", 404);
        const game = gameSnapshot.data();

        return executeOnce(transaction, uid, { requestId, type: "ADVANCE_ROUND", payload: { expectedRound } }, async () => {
            if (game.status !== "ACTIVE") throw fail("Game is not active", 409);
            if (game.currentRound !== expectedRound) throw fail("The game round has changed. Reload before trying again.", 409);
            if (game.currentRound >= simulation.MAX_ROUND) throw fail("Round 6 must be finished, not advanced", 409);

            const newRound = game.currentRound + 1;
            let readyPlots = 0;
            let arrivedShipments = 0;

            for (const snapshot of lotSnapshots.docs) {
                const lot = snapshot.data();
                if (lot.asset !== "RICE") continue;
                const qualityPercent = decayedQuality(lot.asset, lot.qualityPercent, simulation.RICE_QUALITY_LOSS_PP);
                lotRepository.update(transaction, snapshot, {
                    qualityPercent,
                    status: qualityPercent === 0 ? "SPOILED" : "AVAILABLE"
                });
            }

            for (const snapshot of plotSnapshots.docs) {
                const plot = snapshot.data();
                if (plot.status === "GROWING" && plot.readyRound <= newRound) {
                    plotRepository.markReady(transaction, snapshot);
                    readyPlots += 1;
                }
            }

            for (const snapshot of shipmentSnapshots.docs) {
                const shipment = snapshot.data();
                if (shipment.status !== "IN_TRANSIT") continue;
                const qualityPercent = decayedQuality(shipment.asset, shipment.qualityPercent, simulation.RICE_QUALITY_LOSS_PP);
                const patch = { qualityPercent };
                if (shipment.arrivalRound === newRound) {
                    const lotId = crypto.randomUUID();
                    lotRepository.create(transaction, uid, lotId, {
                        asset: shipment.asset,
                        quantity: shipment.quantity,
                        qualityPercent,
                        region: shipment.destination,
                        status: qualityPercent === 0 ? "SPOILED" : "AVAILABLE",
                        source: "SHIPMENT",
                        createdRound: newRound
                    });
                    patch.status = "ARRIVED";
                    patch.arrivedLotId = lotId;
                    gameRepository.createHistory(transaction, uid, {
                        type: "SHIPMENT_ARRIVED",
                        round: newRound,
                        createdAt: new Date(),
                        entityIds: [snapshot.id, lotId],
                        asset: shipment.asset,
                        quantity: shipment.quantity
                    });
                    arrivedShipments += 1;
                }
                shipmentRepository.update(transaction, snapshot, patch);
            }

            gameRepository.updateGame(transaction, uid, { currentRound: newRound, version: Number(game.version || 0) + 1 });
            gameRepository.createHistory(transaction, uid, {
                type: "ROUND_ADVANCED",
                round: newRound,
                createdAt: new Date(),
                requestId,
                details: { fromRound: game.currentRound, readyPlots, arrivedShipments }
            });
            return { currentRound: newRound, readyPlots, arrivedShipments };
        });
    });
}

module.exports = { advance };
