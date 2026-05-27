# Lazy Async Abstraction

## Decision

`@shirudo/result` will not add a lazy `ResultAsync<T, E>` / `TaskResult<T, E>` abstraction for the 1.0 API.

The public async model remains:

- `Promise<Result<T, E>>` for executed async work.
- `Result.fromPromise(...)` / `Result.tryAsync(...)` for promise boundaries.
- `.pipeAsync(...)` and async operators for composition.
- `task(...)` for generator-based do-notation across sync and async `Result` values.

## Rationale

A lazy async wrapper is useful when a library needs a full effect model: deferred execution, retry policies, cancellation, resource scopes, concurrency control, and tracing hooks. Adding only a small wrapper around `Promise<Result<T, E>>` would create a second async style without solving those harder problems.

For 1.0, the simpler model is safer:

- Execution semantics are obvious because users pass and return normal promises.
- Interop with platform APIs, test runners, and application frameworks stays direct.
- The core package avoids carrying retry, cancellation, scheduler, or resource-lifetime opinions.
- The existing `task(...)` helper already covers ergonomic sequential composition without introducing a new runtime container.

## Consequences

Users who need lazy behavior should represent it explicitly as a function:

```ts
import type { Result } from '@shirudo/result';

type TaskResult<T, E> = (signal?: AbortSignal) => Promise<Result<T, E>>;
```

This keeps ownership, cancellation, and execution timing visible at call sites.

## Revisit Criteria

Reconsider a first-class lazy abstraction only if the package intentionally expands into a broader effect toolkit and can provide all of these capabilities coherently:

- Lazy execution with clear memoization semantics.
- AbortSignal-aware cancellation.
- Typed retry and backoff policies.
- Resource cleanup guarantees.
- Concurrency helpers with predictable error accumulation.
- Type tests proving inference across chained async operations.
