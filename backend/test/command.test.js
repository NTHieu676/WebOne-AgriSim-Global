const test = require("node:test");
const assert = require("node:assert/strict");
const { requireRequestId } = require("../src/shared/command");

test("command ids require a stable, sufficiently long token", () => {
  assert.doesNotThrow(() => requireRequestId("12345678-abcd-efgh"));
  assert.throws(() => requireRequestId("short"), { status: 400 });
  assert.throws(() => requireRequestId("invalid space token"), { status: 400 });
});
