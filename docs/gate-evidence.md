# FR — GateEvidence

Le schéma de rapport passe à `schemaVersion: 2`. Le reçu SHA256 lie désormais **tous** les scénarios (outil, arguments, contexte, labels et ordre), les seuils résolus et les résultats. `suiteReceipt` permet de vérifier que deux gates ont été évalués sur les mêmes états. Le rapport ne contient pas les arguments ou le contexte, seulement leurs sommes de contrôle. Ces hashes sont des contrôles de cohérence, pas des signatures ou une preuve de labels indépendants.

`runGateBenchmark` impose un délai d’attente même quand un adapter asynchrone ignore son signal d’annulation. Après le premier timeout, aucun nouveau scénario en file n’est lancé ; ceux déjà engagés peuvent encore terminer. Les autres sont marqués `skipped_after_timeout`. Le runner ne peut ni arrêter un adapter qui bloque le thread JavaScript, ni annuler ses effets externes si le signal est ignoré. Exécutez des adapters non fiables dans des processus isolés. Les erreurs générées sont `adapter_error` ou `timeout`, sans copie de l’exception brute.

`coverage` indique tentatives, résultats complétés, cas sautés et timings disponibles. Un seuil `maxP95Ms` ne passe jamais sans un timing par scénario. Les strates sans observations ou avec erreurs ont des taux `null`, jamais une borne de risque nulle. Une erreur sur un label `review` ne compte pas comme bonne prédiction. Par défaut `maxErrors: 0` fait échouer tout rapport comportant une erreur ; modifiez explicitement ce budget si votre protocole l’exige. Les codes de défaillance sont des identifiants stables et les valeurs comparées figurent dans le rapport.

```sh
npm ci
npm run demo:evidence -- fr
```

L’exemple compare un oracle fictif, une baseline `allow-all`, une série sans timings et un adapter bloqué. Aucun modèle ni gate de production n’est mesuré. Les huit cas publics ne sont pas un holdout ; aucune supériorité SOTA ni garantie de sécurité ne s’en déduit. Les comparaisons doivent utiliser le même corpus, les mêmes seuils et des labels indépendants.

Sources motivant la reproductibilité : [CLM issue 15](https://github.com/Contrastive-LM/CLM/issues/15), [limites déclarées de Jev-Calibration](https://github.com/AnthusAI/Jev-Calibration). Ce dépôt ne reproduit pas leurs modèles ni leurs mesures.

# EN — GateEvidence

Reports move to `schemaVersion: 2`. The SHA256 receipt now binds **all** scenarios (tool, arguments, context, labels and order), resolved thresholds and results. `suiteReceipt` checks whether two gates saw identical states. Reports omit arguments and context, retaining only checksums. These hashes check consistency; they are neither signatures nor proof of independent labels.

`runGateBenchmark` bounds waiting even when an asynchronous adapter ignores its abort signal. After the first timeout, no further queued scenarios are dispatched; already running ones may finish. Others become `skipped_after_timeout`. The runner cannot stop an adapter blocking the JavaScript thread or cancel external effects if the signal is ignored. Run untrusted adapters in isolated processes. Generated errors are `adapter_error` or `timeout`, without raw exception content.

`coverage` records attempts, completed results, skipped cases and timing samples. A `maxP95Ms` threshold never passes without a timing for every scenario. Empty or error-containing strata have `null` rates, never a zero risk bound. An error on a `review` label is not counted as correct. Default `maxErrors: 0` fails any report containing errors; change this budget explicitly if your protocol requires it. Failure codes are stable identifiers; compared values appear in the report.

```sh
npm ci
npm run demo:evidence -- en
```

The example compares a fictional oracle, an `allow-all` baseline, missing timings and a stalled adapter. No production gate or model is measured. The eight public cases are not a holdout and imply neither SOTA superiority nor safety guarantees. Comparisons must use identical corpora and thresholds with independent labels.

Reproducibility sources: [CLM issue 15](https://github.com/Contrastive-LM/CLM/issues/15), [Jev-Calibration's stated limitations](https://github.com/AnthusAI/Jev-Calibration). This repository does not reproduce their models or measurements.

# ES — GateEvidence

Los informes pasan a `schemaVersion: 2`. El recibo SHA256 vincula **todos** los escenarios (herramienta, argumentos, contexto, etiquetas y orden), umbrales efectivos y resultados. `suiteReceipt` comprueba si dos gates recibieron los mismos estados. El informe omite argumentos y contexto, conservando sus hashes. Son comprobaciones de coherencia, no firmas ni prueba de etiquetas independientes.

`runGateBenchmark` limita la espera aunque un adapter asíncrono ignore su señal de cancelación. Tras el primer timeout no se lanzan más escenarios en cola; los ya iniciados pueden terminar. Los demás reciben `skipped_after_timeout`. El runner no puede detener un adapter que bloquee el hilo JavaScript ni cancelar efectos externos cuando se ignore la señal. Ejecute adapters no fiables en procesos aislados. Los errores generados son `adapter_error` o `timeout`, sin copiar la excepción original.

`coverage` registra intentos, resultados completados, casos omitidos y tiempos disponibles. Un umbral `maxP95Ms` no se cumple sin tiempo para cada escenario. Estratos vacíos o con errores tienen tasas `null`, nunca un límite de riesgo cero. Un error con etiqueta `review` no cuenta como predicción correcta. Por defecto `maxErrors: 0` hace fallar informes con errores; cambie explícitamente el presupuesto si su protocolo lo exige. Los códigos de fallo son identificadores estables y los valores comparados aparecen en el informe.

```sh
npm ci
npm run demo:evidence -- es
```

El ejemplo compara un oráculo ficticio, una baseline `allow-all`, tiempos ausentes y un adapter bloqueado. No se mide ningún modelo o gate de producción. Los ocho casos públicos no son holdout y no prueban superioridad SOTA ni garantías de seguridad. Compare corpus y umbrales idénticos con etiquetas independientes.

Fuentes sobre reproducibilidad: [CLM issue 15](https://github.com/Contrastive-LM/CLM/issues/15), [limitaciones declaradas de Jev-Calibration](https://github.com/AnthusAI/Jev-Calibration). No reproducimos sus modelos ni mediciones.
