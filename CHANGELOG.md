# Changelog

## 1.2.0 - 2026-08-19

### Deprecated

- `fromSerialized()` is deprecated and will be removed in 2.0. It validates only the envelope (`_tag` plus the presence of `value`/`error`) while its type parameters claim `T` and `E` for whatever `JSON.parse` returned, the same kind of unverified type claim that 1.1.0 removed from `fromPromise<T, MyError>(promise)`; and it throws `InvalidResultStateError` for malformed input at exactly the boundary where a Result should be returned. Validate foreign payloads with your schema tool and rebuild with `parsed._tag === 'Ok' ? ok(parsed.value) : err(parsed.error)`; the shape is exported as `ResultType<T, E>`.

### Changed

- `toSerialized()` documentation no longer promises a `fromSerialized()` round-trip; it describes the plain discriminated `ResultType<T, E>` shape (identical to `JSON.stringify(result)`) and the `ok`/`err` rebuild. The `serialize()` deprecation notice points to `toSerialized()` alone. README, the API reference, and the agent skill were updated accordingly, and the skill's boundary example now validates the payload instead of asserting its type.
- `toSerialized()` is now tested on its own in `result.test.ts` (shape, `Ok(undefined)`, `JSON.stringify` equivalence, JSON round-trip via `ok`/`err`, malformed state) instead of only through the `fromSerialized()` tests.
- `collectFirstOkAsync()` and `collectFirstOkParallelAsync()` now type the collected errors honestly and accept an optional `errorMapper`. Both collect a rejected input as a failed attempt, but they pushed the raw rejection reason into an array typed as the inputs' `E`, so `E[]` could hold an unmapped `unknown` at runtime. Without `errorMapper` the error array is now `unknown[]`; with `errorMapper: (error: unknown) => F` it is `Array<E | F>`, `Err` values pass through untouched, and bugs inside the mapper are rethrown, the same contract as `fromPromise` and `tryAsync`. Callers that relied on the old `E[]` type without a mapper must add one.
- The compile-time exhaustiveness guarantee of `matchError()`, `matchErr()` and their async variants is now documented with its precondition. The check is structural, so each error class needs a distinguishing member such as a literal `readonly code`; two classes of the same shape count as one case, `run()` compiles with one of them unhandled, and the unhandled error is rethrown at runtime. README, the matching guide and the builder docstring state the rule, and the type tests pin both the guard for distinguishable classes and the limit for look-alike classes.

### Fixed

- `collectFirstOkAsync()` and `collectFirstOkParallelAsync()` now validate every fulfilled value with `isResult()` and reject with `InvalidResultStateError` when an input fulfils with something that is not a Result. Previously the sequential variant, and the parallel variant when no `Ok` arrived, leaked a raw `TypeError` from calling `isOk()` on the value, and the parallel variant's first-Ok race swallowed that `TypeError` in its rejection guard, so a malformed input was hidden entirely whenever another input was observed as `Ok` first. An `Ok` that won the race before the malformed value was observed still wins.
- `collectFirstOkParallelAsync()` now rethrows a thunk's synchronous exception as a programmer error, as `collectFirstOkAsync()` always did. Previously the parallel variant deferred the thunk call into a promise chain, so a synchronous throw was silently collected as an error value, or hidden entirely when another input yielded `Ok`. Attempts that already started are abandoned without an unhandled rejection.
- The matcher builder classes `ErrorMatchBuilder`, `AsyncErrorMatchBuilder`, `ErrMatchBuilder`, and `AsyncErrMatchBuilder` are now exported as types from the root entry. They are the return types of `.matchError()`, `.matchErrorAsync()`, `.matchErr()`, and `.matchErrAsync()`, but a consumer could not name them: a library compiled with `declaration: true` that exported a function returning a builder failed with TS4094 and TS7056, and an explicit annotation was impossible because the import failed with TS2305. The package export check now compiles such a library consumer with declaration emit.
- `task()` now applies the yield protocol inside `finally` blocks that run during an `Err` short-circuit or before a `TaskYieldNotResultError`: `yield*` on an `Ok` receives the Ok value, an `Err` yielded there replaces the pending `Err` (as a `throw` inside `finally` replaces a pending exception) and skips the rest of that block while outer `finally` blocks still run, and a plain value yielded there throws `TaskYieldNotResultError`. Previously the cleanup was resumed with `undefined`, so `const conn = yield* ok(resource)` in a `finally` block produced a `TypeError` that hid the original `Err`, and an `Err` yielded during cleanup was silently dropped.
- `sequenceRecord()` now visits only the enumerable own properties of the record. It iterated `Reflect.ownKeys()`, which also returns the non-enumerable ones, while its `keyof`-based signature, `Object.keys()`, the spread and JSON all skip them. A hidden helper field on an otherwise valid record therefore threw `InvalidResultStateError` although the call type-checked. Symbol keys stay supported, because the enumerability decides, not the kind of the key.

## 1.1.1 - 2026-07-04

### Changed

- Documentation only, no code changes. The README was rewritten: the intro leads with the signature payoff, the Why sections argue the pattern and the library's guarantees, the Quick Start shows pipe composition instead of a switch block, error discriminants use `code` instead of `type` across all examples, an exhaustive `matchError` workflow example and a When Not to Use It section were added, and static version badges were removed.
- CI actions were updated to their current majors (checkout v7, setup-node v6, codecov v7).

## 1.1.0 - 2026-07-04

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
