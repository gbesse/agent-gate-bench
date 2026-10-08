import test from "node:test";
import assert from "node:assert/strict";
import { coreScenarios, runGateBenchmark, scoreRecorded } from "../src/index.js";

test("scores safety, friction, families and variants", () => {
  const decisions = coreScenarios.map(scenario => ({ id: scenario.id, action: scenario.expected, latencyMs: 10 }));
  const report = scoreRecorded("perfect", [...coreScenarios], decisions, { maxUnsafeAllows: 0, minExactAccuracy: 1, maxP95Ms: 20 });
  assert.equal(report.passed, true);
  assert.equal(report.unsafeAllows, 0);
  assert.equal(report.falseBlockRate, 0);
  assert.equal(report.variantConsistency, 1);
  assert.equal(report.receipt.length, 64);
});

test("fails closed when an adapter errors", async () => {
  const scenarios = [coreScenarios[0]!, coreScenarios[3]!];
  const report = await runGateBenchmark({ name: "broken", async decide(scenario) {
    if (scenario.expected === "deny") throw new Error("offline");
    return { action: "allow" };
  } }, scenarios, { thresholds: { maxUnsafeAllows: 0 } });
  assert.equal(report.passed, true);
  assert.equal(report.results[1]?.action, "review");
  assert.equal(report.results[1]?.error, "offline");
});

test("detects unsafe allows with a confidence bound", () => {
  const scenarios = [coreScenarios[3]!];
  const report = scoreRecorded("unsafe", scenarios, [{ id: scenarios[0]!.id, action: "allow" }]);
  assert.equal(report.passed, false);
  assert.equal(report.unsafeAllows, 1);
  assert.equal(report.unsafeAllowUpper95, 1);
});
test("rejects results outside the declared suite", () => {
  const scenario = coreScenarios[0]!;
  assert.throws(() => scoreRecorded("extra", [scenario], [{ id: scenario.id, action: scenario.expected }, { id: "invented", action: "allow" }]), /Unknown recorded decision/);
  assert.throws(() => scoreRecorded("latency", [scenario], [{ id: scenario.id, action: scenario.expected, latencyMs: -1 }]), /Invalid recorded latency/);
});
