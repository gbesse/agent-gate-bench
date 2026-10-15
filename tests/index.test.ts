import test from 'node:test';
import assert from 'node:assert/strict';
import { coreScenarios, runGateBenchmark, scoreRecorded } from '../src/index.js';

test('scores safety, friction, families and variants', () => {
  const decisions = coreScenarios.map((scenario) => ({
    id: scenario.id,
    action: scenario.expected,
    latencyMs: 10,
  }));
  const report = scoreRecorded('perfect', [...coreScenarios], decisions, {
    maxUnsafeAllows: 0,
    minExactAccuracy: 1,
    maxP95Ms: 20,
  });
  assert.equal(report.passed, true);
  assert.equal(report.unsafeAllows, 0);
  assert.equal(report.falseBlockRate, 0);
  assert.equal(report.variantConsistency, 1);
  assert.equal(report.receipt.length, 64);
});

test('fails closed when an adapter errors', async () => {
  const scenarios = [coreScenarios[0]!, coreScenarios[3]!];
  const report = await runGateBenchmark(
    {
      name: 'broken',
      async decide(scenario) {
        if (scenario.expected === 'deny') throw new Error('offline');
        return { action: 'allow' };
      },
    },
    scenarios,
    { thresholds: { maxUnsafeAllows: 0 } },
  );
  assert.equal(report.passed, false);
  assert.equal(report.results[1]?.action, 'review');
  assert.equal(report.results[1]?.error, 'adapter_error');
});

test('detects unsafe allows with a confidence bound', () => {
  const scenarios = [coreScenarios[3]!];
  const report = scoreRecorded('unsafe', scenarios, [{ id: scenarios[0]!.id, action: 'allow' }]);
  assert.equal(report.passed, false);
  assert.equal(report.unsafeAllows, 1);
  assert.equal(report.unsafeAllowUpper95, 1);
});
test('rejects results outside the declared suite', () => {
  const scenario = coreScenarios[0]!;
  assert.throws(
    () =>
      scoreRecorded(
        'extra',
        [scenario],
        [
          { id: scenario.id, action: scenario.expected },
          { id: 'invented', action: 'allow' },
        ],
      ),
    /Unknown recorded decision/,
  );
  assert.throws(
    () =>
      scoreRecorded(
        'latency',
        [scenario],
        [{ id: scenario.id, action: scenario.expected, latencyMs: -1 }],
      ),
    /Invalid recorded latency/,
  );
});

test('deadline stops waiting for ignored abort signals and stops queued dispatch', async () => {
  let calls = 0;
  const started = performance.now();
  const report = await runGateBenchmark(
    {
      name: 'never-settles',
      decide() {
        calls++;
        return new Promise(() => {});
      },
    },
    [...coreScenarios],
    { concurrency: 1, timeoutMs: 15 },
  );
  assert(performance.now() - started < 1000);
  assert.equal(calls, 1);
  assert.equal(report.passed, false);
  assert.equal(
    report.results.find((result) => result.id === coreScenarios[0]!.id)?.error,
    'timeout',
  );
  assert.equal(report.coverage.skipped, 7);
  assert.equal(report.coverage.attempted, 1);
  assert.equal(report.coverage.completed, 0);
  assert.equal(report.unsafeAllowRate, null);
  assert.equal(report.unsafeAllowUpper95, null);
});

test('generated adapter errors never copy raw exception content', async () => {
  const report = await runGateBenchmark(
    {
      name: 'broken',
      async decide() {
        throw new Error('PRIVATE_SENTINEL');
      },
    },
    [coreScenarios[0]!],
  );
  assert.equal(JSON.stringify(report).includes('PRIVATE_SENTINEL'), false);
  assert.equal(report.errors, 1);
  assert.equal(report.passed, false);
});

test('latency constraint requires every timing sample', () => {
  const suite = [...coreScenarios];
  const decisions = suite.map((s) => ({ id: s.id, action: s.expected }));
  const absent = scoreRecorded('no-timings', suite, decisions, { maxP95Ms: 100 });
  assert.equal(absent.passed, false);
  assert(absent.failures.includes('latency_coverage_incomplete'));
  const partial = scoreRecorded(
    'partial',
    suite,
    decisions.map((d, i) => (i ? d : { ...d, latencyMs: 1 })),
    { maxP95Ms: 100 },
  );
  assert.equal(partial.passed, false);
  assert.equal(partial.coverage.latencySamples, 1);
});

test('empty measurement strata have unknown rates, never a zero risk bound', () => {
  const s = coreScenarios[0]!;
  const r = scoreRecorded('safe-only', [s], [{ id: s.id, action: 'allow' }]);
  assert.equal(r.unsafeAllowRate, null);
  assert.equal(r.unsafeAllowUpper95, null);
  const dangerous = coreScenarios[3]!;
  const d = scoreRecorded('danger-only', [dangerous], [{ id: dangerous.id, action: 'deny' }], {
    maxFalseBlockRate: 1,
  });
  assert.equal(d.falseBlockRate, null);
  assert.equal(d.passed, false);
});

test('receipt binds tool, arguments, context and resolved thresholds', () => {
  const original = structuredClone([...coreScenarios]);
  const decisions = original.map((s) => ({ id: s.id, action: s.expected, latencyMs: 1 }));
  const first = scoreRecorded('same-labels', original, decisions);
  for (const change of [
    (s: typeof original) => (s[0]!.tool = 'different'),
    (s: typeof original) => (s[0]!.arguments = { path: 'different' }),
    (s: typeof original) => (s[0]!.context = { userIntent: 'different' }),
  ]) {
    const changed = structuredClone(original);
    change(changed);
    const report = scoreRecorded('same-labels', changed, decisions);
    assert.notEqual(report.suiteReceipt, first.suiteReceipt);
    assert.notEqual(report.receipt, first.receipt);
  }
  const changedPolicy = scoreRecorded('same-labels', original, decisions, { maxUnsafeAllows: 1 });
  assert.equal(changedPolicy.suiteReceipt, first.suiteReceipt);
  assert.notEqual(changedPolicy.receipt, first.receipt);
});

test('canonical receipt tolerates key order and absent optional fields', () => {
  const a = { ...coreScenarios[0]!, arguments: { z: 1, a: 2 } };
  const b = { ...coreScenarios[0]!, arguments: { a: 2, z: 1 } };
  Object.assign(b, { context: undefined });
  assert.equal(
    scoreRecorded('a', [a], [{ id: a.id, action: 'allow' }]).suiteReceipt,
    scoreRecorded('a', [b], [{ id: b.id, action: 'allow' }]).suiteReceipt,
  );
});

test('invalid thresholds and timeouts are rejected before adapter calls', async () => {
  for (const thresholds of [
    { maxUnsafeAllows: -1 },
    { maxUnsafeAllows: 0.5 },
    { minExactAccuracy: NaN },
    { maxFalseBlockRate: 2 },
    { maxP95Ms: Infinity },
    { maxErrors: -1 },
  ]) {
    assert.throws(() => scoreRecorded('x', [...coreScenarios], [], thresholds), /benchmark/);
  }
  let calls = 0;
  for (const timeoutMs of [0, -1, NaN, Infinity, 1.5]) {
    await assert.rejects(
      runGateBenchmark(
        {
          name: 'x',
          async decide() {
            calls++;
            return { action: 'allow' };
          },
        },
        [...coreScenarios],
        { timeoutMs },
      ),
      /timeoutMs/,
    );
  }
  assert.equal(calls, 0);
});

test('an error on a review scenario is not counted as correct', () => {
  const s = coreScenarios[7]!;
  const r = scoreRecorded(
    'error',
    [s],
    [{ id: s.id, action: 'review', error: 'declared failure' }],
  );
  assert.equal(r.exactAccuracy, 0);
  assert.equal(r.byFamily[s.family]?.exactAccuracy, 0);
  assert.equal(r.errors, 1);
});

test('suite hashing rejects nonfinite values and unsupported objects', () => {
  for (const args of [{ value: NaN }, { value: new Date() }, { value: () => true }]) {
    assert.throws(
      () =>
        scoreRecorded(
          'x',
          [{ ...coreScenarios[0]!, arguments: args }],
          [{ id: coreScenarios[0]!.id, action: 'allow' }],
        ),
      /json/,
    );
  }
});

test('run snapshot survives caller mutations to cases, thresholds and adapter name', async () => {
  const suite = structuredClone([coreScenarios[0]!]);
  const baseline = scoreRecorded('frozen', suite, [{ id: suite[0]!.id, action: 'allow' }]);
  const thresholds = { maxUnsafeAllows: 0, minExactAccuracy: 1 };
  const adapter = {
    name: 'frozen',
    async decide() {
      suite[0]!.expected = 'deny';
      suite[0]!.arguments = { path: '.env' };
      thresholds.minExactAccuracy = 0;
      adapter.name = 'mutated';
      return { action: 'allow' as const };
    },
  };
  const report = await runGateBenchmark(adapter, suite, { thresholds });
  assert.equal(report.gate, 'frozen');
  assert.equal(report.suiteReceipt, baseline.suiteReceipt);
  assert.equal(report.thresholds.minExactAccuracy, 1);
  assert.equal(report.exactAccuracy, 1);
});

test('invalid adapter identity is rejected without starting work', async () => {
  let calls = 0;
  await assert.rejects(
    runGateBenchmark(
      {
        name: '',
        async decide() {
          calls++;
          return { action: 'allow' };
        },
      },
      [...coreScenarios],
    ),
    /adapter/,
  );
  assert.equal(calls, 0);
});
