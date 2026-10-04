#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { coreScenarios, scoreRecorded, type GateScenario, type GateThresholds, type RecordedDecision } from "./index.js";

const [command, suitePath, resultsPath, thresholdsPath] = process.argv.slice(2);
if (command !== "score" || !resultsPath) {
  console.error("Usage: agent-gate-bench score <suite.json|core> <results.json> [thresholds.json]");
  process.exit(1);
}
try {
  const scenarios = suitePath === "core" ? [...coreScenarios] : JSON.parse(await readFile(suitePath!, "utf8")) as GateScenario[];
  const payload = JSON.parse(await readFile(resultsPath, "utf8")) as { gate: string; decisions: RecordedDecision[] };
  const thresholds = thresholdsPath ? JSON.parse(await readFile(thresholdsPath, "utf8")) as GateThresholds : {};
  const report = scoreRecorded(payload.gate, scenarios, payload.decisions, thresholds);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
