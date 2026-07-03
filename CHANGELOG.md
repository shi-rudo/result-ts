# Changelog

## Unreleased

### Added

- `toSerialized()` serializes a Result into the discriminated shape `{ _tag: 'Ok', value }` / `{ _tag: 'Err', error }`, and the new `fromSerialized()` rebuilds a real Result from it — including an unambiguous `Ok(undefined)` and JSON round-trips.

### Deprecated

- `serialize()` — its format cannot round-trip (`Ok(undefined)` is indistinguishable from a missing `data` field). Use `toSerialized()` / `fromSerialized()`.
- `unwrapOrDefault()` — misleading name (Rust's `unwrap_or_default` takes no argument); use `unwrapOr()`.
- `ERR_INVALID_STATE` — use `ERR_INVALID_RESULT_STATE`.

### Fixed

- `matchErrorAsync()` and `matchErrAsync()` now evaluate handlers lazily on the first awaited `run()`/`otherwise()` call (memoized). Abandoned builder chains no longer start handler promises, so a rejecting handler can no longer cause an unhandled rejection, and handler side effects no longer run when the chain is never consumed.
- `matchTag()` no longer resolves handlers from the prototype chain: a tag value like `"toString"` previously invoked `Object.prototype.toString` as a handler instead of failing. A missing handler now throws the new `MatchTagMissingHandlerError` (code `ERR_MATCH_TAG_MISSING_HANDLER`, carries `tagValue`) instead of a misleading `InvalidResultStateError`.
- `expect()`, `expectErr()`, `expectResult()`, and the `expectErr` utility now preserve the original Result payload on the thrown error: `ExpectOkError` carries `errorValue`, `ExpectErrError` carries `okValue`, both set `cause` and include the value in the message.
- `task()` now completes generator cleanup on all abort paths: cleanup errors on the yield-not-a-Result path route through `onThrow` when provided, and `finally` blocks containing `yield` are driven to completion instead of being abandoned mid-cleanup.
- `contains()` and `containsErr()` compare with `Object.is` (SameValue), so `NaN` values are found; `+0`/`-0` are now distinct.

### Changed

- The internal Result brand symbol now lives on the shared prototype instead of being defined per instance, making `ok()`/`err()` construction roughly 5x faster (the remaining cost is the deliberate `Object.freeze` immutability guarantee). `isResult()` behavior is unchanged.
- `fromPromise`, `tryAsync`, `fromThrowable`, `tryCatch`, `tryCatchAsync`, `tryMap`, and `tryMapAsync` now require the `errorMapper` argument when an explicit error type parameter is supplied. Previously, calls like `fromPromise<T, MyError>(promise)` compiled without a mapper while the runtime error stayed unmapped (`unknown`), so the declared error type was a lie. Such calls are now compile errors; calls without explicit type parameters keep returning `unknown` errors as before.

## 1.0.2 - 2026-06-28

### Fixed

- `task()` now runs the generator's `finally` blocks before the `TaskYieldNotResultError` and `InvalidResultStateError` paths, matching the cleanup already performed on the normal `Err` short-circuit.

### Changed

- Clarified the deprecated `Result.match()` JSDoc to distinguish it from the `match({ ok, err })` pipe operator.

## 1.0.1 - 2026-05-28

### Fixed

- Fixed the release-quality CI order so package exports are built before documentation examples are type-checked in clean checkouts.
- Added Node 20 and Node 22 CI coverage for the quality workflow.
- Added an edge-runtime compatibility check for built ESM artifacts.
- Added the missing MIT license file.
- Removed the Codecov badge from the README.

## 1.0.0 - 2026-05-27

### Breaking Changes

- `Ok` no longer exposes an `error` property and `Err` no longer exposes a `value` property. Access `result.value` or `result.error` only after narrowing with `.isOk()` or `.isErr()`.
- `Result.fromPromise()` / `fromPromise()` now rethrow exceptions raised by `errorMapper` instead of converting mapper bugs into `Err` values.
- `matchErr()` handlers must now return a `Result` explicitly. Return `ok(value)` for recovery and `err(error)` for mapped errors.
- `matchErr().when(...)`, `matchErr().whenGuard(...)`, and `matchErr().otherwise(...)` now reject non-Result handler returns at runtime with `MatchErrHandlerNotResultError`.
- The package is promoted to the `1.0.0` major line.

### Migration

Before:

```ts
result
  .matchErr()
  .when(ParseError, error => new ValidationError(error.message))
  .otherwise(error => new UnknownError(String(error)));
```

After:

```ts
result
  .matchErr()
  .when(ParseError, error => err(new ValidationError(error.message)))
  .otherwise(error => err(new UnknownError(String(error))));
```

For recovery, wrap the recovered value in `ok(...)`:

```ts
result
  .matchErr()
  .when(NetworkError, () => ok(cachedValue))
  .otherwise(error => err(error));
```

### Fixed

- Added `Result.is`, `Result.fromThrowable`, `Result.tryAsync`, `Result.sequence`, `Result.all`, and `Result.combine` as namespace entrypoints.
- Added `matchTag(result, key, handlers)` for exhaustive object matching over discriminated-union errors.
- Added subpath exports for `@shirudo/result/errors`, `@shirudo/result/operators`, and `@shirudo/result/collections`, backed by ESM/CJS/type resolution checks.
- Added `pnpm docs:check` to compile-check TypeScript examples from README and docs.
- Added `pnpm check`, `pnpm check:clean`, and a GitHub Actions CI workflow for the full release quality chain.
- Documented the 1.0 decision to keep async composition on `Promise<Result<T, E>>` instead of adding a lazy async wrapper.
- Hardened `isResult` with a stable internal brand and `_tag`/payload validation instead of relying on `instanceof` only.
- Added `.matchError()` as the explicit name for Err-only fluent matching. `.match()` remains available as a compatibility alias.
- Added `.whenTag(key, value, handler)` to fluent matchers for discriminated-union error types.
- Added `.matchErrorAsync()` and `.matchErrAsync()` for fluent async matching.
- Removed the `matchErr()` footgun where naked handler return values were silently interpreted as `Err(value)`.
- Updated matcher documentation to use the actual `.when(...)` / `.whenGuard(...)` API.
