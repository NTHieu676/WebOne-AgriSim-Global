const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSnapshot } = require("../src/services/summaryService");

test("summary values usable lots at round-six regional price and quality", () => {
  const summary = buildSnapshot(
    { walletUsdG: 2400, totalTopups: 500 },
    [
      { id: "rice-a", asset: "RICE", quantity: 20, qualityPercent: 90, region: "CHAU_A", status: "AVAILABLE" },
      { id: "gold-e", asset: "GOLD", quantity: 2, qualityPercent: 100, region: "CHAU_AU", status: "AVAILABLE" },
      { id: "spoiled", asset: "RICE", quantity: 99, qualityPercent: 0, region: "CHAU_A", status: "SPOILED" }
    ],
    [{ type: "SWAPPED", swapFeeUsdEquivalent: 0.3 }, { type: "SHIPPED", shipmentFeeUsd: 5 }, { type: "PLANTED" }],
    { RICE: { CHAU_A: 10 }, GOLD: { CHAU_AU: 104 } }
  );
  assert.equal(summary.warehouseValue, 388);
  assert.equal(summary.endNetWorth, 2788);
  assert.equal(summary.netChange, 288);
  assert.equal(summary.totalSwapFeesUsdEquivalent, 0.3);
  assert.equal(summary.totalShippingFeesUsd, 5);
  assert.equal(summary.transactionCount, 3);
  assert.equal(summary.remainingLots.length, 2);
});
