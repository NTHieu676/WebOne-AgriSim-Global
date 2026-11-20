const test = require("node:test");
const assert = require("node:assert/strict");
const { quote } = require("../src/services/swapService");

const pool = { assetReserve: 1000, usdgReserve: 10000, feeRate: 0.003 };

test("selling 10 assets follows the documented constant-product example", () => {
  const result = quote(pool, "SELL", 10);
  assert.equal(result.fee, 0.03);
  assert.equal(result.amountOut, 98.71580343);
  assert.equal(result.poolPriceBefore, 10);
  assert.equal(result.executionPrice, 9.87158034);
});

test("buying assets charges the fee inside the amount-in formula", () => {
  const result = quote(pool, "BUY", 100);
  assert.equal(result.fee, 0.3);
  assert.ok(result.amountOut > 9 && result.amountOut < 10);
  assert.ok(result.executionPrice > result.poolPriceBefore);
});

test("invalid quantity and insufficient output liquidity are rejected", () => {
  assert.throws(() => quote(pool, "SELL", 0), { status: 400 });
  assert.throws(() => quote({ assetReserve: 1000, usdgReserve: 0, feeRate: 0.003 }, "SELL", 10), { status: 422 });
});

test("AMM accepts decimal input up to eight places without float drift", () => {
  const result = quote(pool, "BUY", "0.1");
  assert.equal(result.fee, 0.0003);
  assert.equal(result.quantityIn, 0.1);
  assert.ok(result.amountOut > 0);
  assert.throws(() => quote(pool, "BUY", "0.123456789"), { status: 400 });
});
