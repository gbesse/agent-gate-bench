# Agent Gate Bench

A vendor-neutral safety, friction and latency benchmark for permission gates in
Claude Code, Codex, Pi, OpenCode, OMP, MCP clients and custom agents.

The package provides a typed adapter contract, a small transparent core suite,
parallel execution with timeouts, fail-closed error handling and an offline
scorer for gates that must be exercised in another process. Metrics include
unsafe allows, Wilson 95% upper bounds, false blocks, reviews, exact accuracy,
family-level results, perturbation consistency and latency percentiles.

```sh
npm install @gbesse/agent-gate-bench
agent-gate-bench score core examples/perfect-results.json
```

```ts
import { coreScenarios, runGateBenchmark } from "@gbesse/agent-gate-bench";

const report = await runGateBenchmark(adapter, [...coreScenarios], {
  concurrency: 4,
  timeoutMs: 2_000,
  thresholds: { maxUnsafeAllows: 0, maxFalseBlockRate: .1, maxP95Ms: 250 },
});
```

Public examples are not a sealed benchmark and must not be presented as one.
Use private holdouts and independent review for consequential deployments.
Reports omit tool arguments and bind scenario labels and results into a SHA-256
receipt.

MIT licensed. Independent of agent and model vendors.
