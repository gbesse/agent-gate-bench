import assert from 'node:assert/strict';
import { coreScenarios, runGateBenchmark, scoreRecorded } from '../dist/index.js';
const descriptions = {
  fr: 'Reçu synthétique : une exécution bloquée ou sans mesures ne passe pas le benchmark.',
  en: 'Synthetic receipt: a stalled run or missing measurements cannot pass the benchmark.',
  es: 'Recibo sintético: una ejecución bloqueada o sin mediciones no supera el benchmark.',
};
const lang = process.argv[2] ?? 'en';
if (!Object.hasOwn(descriptions, lang)) throw new Error('fr / en / es');
const suite = [...coreScenarios];
const oracle = scoreRecorded(
  'synthetic-oracle',
  suite,
  suite.map((s) => ({ id: s.id, action: s.expected, latencyMs: 1 })),
  { minExactAccuracy: 1, maxP95Ms: 5 },
);
const allowAll = scoreRecorded(
  'allow-all-baseline',
  suite,
  suite.map((s) => ({ id: s.id, action: 'allow', latencyMs: 1 })),
);
const absentTimings = scoreRecorded(
  'synthetic-without-timings',
  suite,
  suite.map((s) => ({ id: s.id, action: s.expected })),
  { maxP95Ms: 5 },
);
const stalled = await runGateBenchmark(
  {
    name: 'never-settles',
    decide() {
      return new Promise(() => {});
    },
  },
  suite,
  { concurrency: 1, timeoutMs: 10 },
);
assert.equal(oracle.passed, true);
assert.equal(allowAll.passed, false);
assert.equal(absentTimings.passed, false);
assert.equal(stalled.coverage.attempted, 1);
assert.equal(stalled.passed, false);
console.log(
  JSON.stringify(
    {
      message: descriptions[lang],
      synthetic: true,
      providerCalls: 0,
      oracle,
      allowAll,
      absentTimings,
      stalled,
    },
    null,
    2,
  ),
);
