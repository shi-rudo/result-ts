# State-of-the-Art Roadmap

This page tracks the remaining work to make `@shirudo/result` a state-of-the-art Result library for TypeScript.

Every implementation task must follow TDD: write failing runtime or type tests first, implement the smallest safe change, then verify with the full quality chain. Every completed task gets its own commit.

## P1: API Soundness

- [x] Harden impossible fields on `Ok` and `Err`.
  - Problem: `Ok` currently exposes `error = undefined`; `Err` exposes `value = undefined`. This makes accidental reads possible without proper narrowing.
  - Target: accessing the impossible field is either not part of the public type or typed as impossible in a way that fails early for misuse.
  - Acceptance: type tests prove `result.value` / `result.error` require narrowing; runtime behavior stays immutable and predictable.
  - Breaking: yes.

- [ ] Replace `instanceof`-only `isResult` with robust branding.
  - Problem: `instanceof Ok || instanceof Err` rejects valid Results created by another package copy or JS realm.
  - Target: use an internal brand, preferably `Symbol.for(...)`, plus `_tag` and payload validation.
  - Acceptance: branded Results are accepted across duplicate module instances where possible; impostors with only methods or tags are rejected.
  - Breaking: potentially, depending on whether structural Results were intentionally accepted.

- [ ] Stop swallowing mapper bugs in `fromPromise`.
  - Problem: exceptions thrown by `errorMapper` are converted to `Err<E>`, which can hide programmer bugs as domain errors.
  - Target: promise rejections are mapped; mapper exceptions rethrow or are modeled explicitly by a separate API.
  - Acceptance: tests cover rejected promises, mapper success, and mapper throws.
  - Breaking: yes.

## P2: API Completeness

- [ ] Expand the `Result` namespace API.
  - Target candidates: `Result.is`, `Result.tryAsync`, `Result.fromThrowable`, `Result.sequence`, `Result.all`, `Result.combine`.
  - Acceptance: namespace functions are aliases or thin wrappers over existing core implementations, with type tests for inference.
  - Breaking: no.

- [ ] Add an exhaustive object matcher for tagged unions.
  - Problem: fluent `.whenTag(...)` works, but object-style matching can provide clearer exhaustive handling for discriminated unions.
  - Target: an API like `matchTag(result, 'type', { network, validation })` or equivalent.
  - Acceptance: missing tags fail type tests; runtime rejects invalid states and preserves current matcher behavior.
  - Breaking: no.

- [ ] Decide whether to add a lazy async abstraction.
  - Problem: `Promise<Result<T, E>>` is simple, but advanced users may want lazy composition, retries, and cancellation support.
  - Target: design decision for `ResultAsync` / `TaskResult`, including whether it belongs in this package.
  - Acceptance: documented decision record before implementation.
  - Breaking: no.

## P3: Distribution and Documentation Quality

- [ ] Add subpath exports.
  - Target candidates: `@shirudo/result/errors`, `@shirudo/result/operators`, `@shirudo/result/collections`.
  - Acceptance: package export tests prove ESM, CJS, and types resolve correctly.
  - Breaking: no.

- [ ] Typecheck documentation examples.
  - Problem: docs can drift from the public API.
  - Target: extract or mirror docs examples into compile-tested snippets.
  - Acceptance: docs examples are covered by `pnpm test:types` or a dedicated `pnpm docs:check`.
  - Breaking: no.

- [ ] Add release and CI hardening.
  - Target: CI should run typecheck, type tests, runtime tests, property tests, docs build, package build, and package export checks.
  - Acceptance: local scripts map cleanly to CI jobs and fail on generated artifacts or stale docs.
  - Breaking: no.
