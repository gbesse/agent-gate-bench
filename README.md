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
Reports omit tool arguments and bind complete scenarios, thresholds and results into a SHA-256 receipt. / Les rapports lient les scénarios complets, seuils et résultats, sans afficher les arguments. / Los informes vinculan escenarios completos, umbrales y resultados sin mostrar argumentos.

MIT licensed. Independent of agent and model vendors.

## October 2026 improvement · Amélioration d’octobre 2026 · Mejora de octubre de 2026

Recorded benchmark results now reject unknown scenario IDs, invalid actions and negative latency before scoring. Run `npm test` offline.

Les résultats enregistrés refusent désormais les identifiants de scénario inconnus, les actions invalides et les latences négatives avant le calcul. Lancez `npm test` hors ligne.

Los resultados registrados ahora rechazan identificadores de escenario desconocidos, acciones inválidas y latencias negativas antes de calcular. Ejecute `npm test` sin conexión.

## GateEvidence — FR / EN / ES

FR : Délais d’attente imposés, couverture explicite, contraintes de latence qui refusent les timings absents et reçu des états complets. [Guide et limites](docs/gate-evidence.md).

EN: Enforced waiting deadlines, explicit coverage, latency constraints rejecting missing timings and full-state receipts. [Guide and limitations](docs/gate-evidence.md).

ES: Plazos de espera efectivos, cobertura explícita, límites de latencia que rechazan tiempos ausentes y recibos de estados completos. [Guía y límites](docs/gate-evidence.md).


FR : Les familles personnalisées comme `__proto__` restent présentes dans les rapports JSON. Les tableaux d’arguments doivent être denses et sans propriété supplémentaire : une forme perdue lors de la sérialisation est refusée avant tout appel d’adaptateur. Cela protège la fidélité des preuves, sans établir la sûreté d’un agent réel.

EN: Custom families such as `__proto__` remain present in JSON reports. Argument arrays must be dense and have no additional properties: shapes lost in serialization are rejected before adapter calls. This protects evidence fidelity without establishing a real agent’s safety.

ES: Las familias personalizadas como `__proto__` permanecen en los informes JSON. Los arrays de argumentos deben ser densos y sin propiedades adicionales: las formas que se pierden al serializar se rechazan antes de llamar al adaptador. Esto protege la fidelidad de las pruebas sin demostrar la seguridad de un agente real.
