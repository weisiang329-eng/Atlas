import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.ts";
import { getHealth } from "../src/health.ts";

test("health response identifies the Atlas API", () => {
  assert.deepEqual(getHealth(), {
    status: "ok",
    service: "atlas-api",
    version: "0.0.0",
  });
});

test("loadConfig validates the HTTP port", () => {
  assert.equal(loadConfig({ PORT: "4000", NODE_ENV: "test" }).port, 4000);
  assert.throws(() => loadConfig({ PORT: "0" }), /PORT/);
});
