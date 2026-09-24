# Changelog

## 2.0.0 - Unreleased

Version 2 removes the APIs that 1.x deprecated. `docs/migration/v2.md` lists every breaking change with its replacement.

### Removed

- `fromSerialized()`, deprecated in 1.2.0. Validate the payload with your schema tool and rebuild with `parsed._tag === 'Ok' ? ok(parsed.value) : err(parsed.error)`. A malformed payload such as `{ _tag: 'Nope' }` made `fromSerialized()` throw `InvalidResultStateError`. Your schema step reports that failure now.
- `.serialize()`, deprecated in 1.1.0. Use `.toSerialized()`. The shape changes from `{ isSuccess, data?, error? }` to `{ _tag: 'Ok', value } | { _tag: 'Err', error }`, so a receiver reads the state from `_tag`.
- `unwrapOrDefault()`, deprecated in 1.1.0. Use `unwrapOr()`, which takes the same arguments.
- `ERR_INVALID_STATE`, deprecated in 1.1.0. Use `ERR_INVALID_RESULT_STATE`, which holds the same string.
- The `.match()` method of a Result, deprecated in 1.0.0 as an alias of `.matchError()`. Use `.matchError()`, which returns the same builder. The `match({ ok, err })` pipe operator stays.

### Changed

- The `MatchOnOkError` constructor requires the name of the method that was called on an `Ok`. The default was `'match'`, the name of the removed method, and every caller inside the library already passed a name. TypeScript code that constructs the error without an argument no longer compiles. JavaScript code still runs, and the message then starts with `undefined()` instead of a method name.
- `sequenceRecord()` rejects an array or a tuple at compile time. Such a call compiled before and always threw `InvalidResultStateError`. Use `sequence()` for a list. An argument typed as a union of an array and a record also stops compiling. A record with the key `length` and a generic caller over `Record<string, Result<T, E>>` still compile.
- `sequenceRecord()` leaves out a key that holds `undefined`, like a missing key. Before, it threw `InvalidResultStateError`, although the type of an optional key admits `undefined`. Other values that are no `Result` still throw.
- `InvalidResultStateError` no longer starts its message with "Unreachable:". An optional second constructor argument replaces the default message. `sequenceRecord()`, `collectFirstOkAsync()` and `collectFirstOkParallelAsync()` use it to name the value that is no `Result`. The code `ERR_INVALID_RESULT_STATE` is unchanged.
- A GitHub release of a version below the current `latest` publishes under the dist-tag `latest-<major>`, for example `latest-1`. `npm install @shirudo/result` keeps resolving to the newest major.

## 1.2.0 - 2026-09-22

### Deprecated

- `fromSerialized()` is deprecated and will be removed in 2.0. It validates only the envelope, the `_tag` discriminant plus the absence of the key of the other state, while its type parameters claim `T` and `E` for whatever `JSON.parse` returned, the same kind of unverified type claim that 1.1.0 removed from `fromPromise<T, MyError>(promise)`; and it throws `InvalidResultStateError` for malformed input at exactly the boundary where a Result should be returned. Validate foreign payloads with your schema tool and rebuild with `parsed._tag === 'Ok' ? ok(parsed.value) : err(parsed.error)`; the shape is exported as `ResultType<T, E>`.

### Changed
- `ResultType<T, E>` now marks the payload key optional exactly where `T` or `E` admits `undefined`. `JSON.stringify` drops a key whose value is `undefined`, so `Ok(undefined)` arrives as `{"_tag":"Ok"}`, but the type demanded `value` for every `T`. A payload validated against `ResultType<void, ApiError>` therefore could not be described at all, and the documented rebuild `parsed._tag === 'Ok' ? ok(parsed.value) : err(parsed.error)` needed a cast for every `Result<void, E>`. The key stays required wherever `T` or `E` excludes `undefined`, and `toSerialized()` still writes it in every case. The condition has a price: a generic helper over `ResultType<T, E>` reads the payload as `T | undefined` and needs a cast, because TypeScript cannot resolve the condition while `T` is a type parameter. At a concrete instantiation the payload keeps its type. The type tests pin all three. The change is breaking at the type level for a consumer that names the previous shape: `{ _tag: 'Ok'; value: T } | { _tag: 'Err'; error: E }` no longer accepts the return of `toSerialized()` wherever `T` or `E` admits `undefined`, although the returned object always carries the key.

- `toSerialized()` documentation no longer promises a `fromSerialized()` round-trip; it describes the plain discriminated `ResultType<T, E>` shape, which `JSON.stringify` encodes exactly as it encodes the Result, and the `ok`/`err` rebuild. The `serialize()` deprecation notice points to `toSerialized()` alone. README, the API reference, and the agent skill were updated accordingly, and the skill's boundary example now validates the payload instead of asserting its type.
- `toSerialized()` is now tested on its own in `result.test.ts` (shape, `Ok(undefined)`, `JSON.stringify` equivalence, JSON round-trip via `ok`/`err`, malformed state) instead of only through the `fromSerialized()` tests.
- `collectFirstOkAsync()` and `collectFirstOkParallelAsync()` now type the collected errors honestly and accept an optional `errorMapper`. Both collect a rejected input as a failed attempt, but they pushed the raw rejection reason into an array typed as the inputs' `E`, so `E[]` could hold an unmapped `unknown` at runtime. Without `errorMapper` the error array is now `unknown[]`; with `errorMapper: (error: unknown) => F` it is `Array<E | F>`, `Err` values pass through untouched, and bugs inside the mapper are rethrown, the same contract as `fromPromise` and `tryAsync`. Callers that relied on the old `E[]` type without a mapper must add one.
- The compile-time exhaustiveness guarantee of `matchError()`, `matchErr()` and their async variants is now documented with its precondition. The check is structural, so each error class needs a distinguishing member such as a literal `readonly code`; two classes of the same shape count as one case, `run()` compiles with one of them unhandled, and the unhandled error is rethrown at runtime. README, the matching guide and the builder docstring state the rule, and the type tests pin both the guard for distinguishable classes and the limit for look-alike classes.

- The `./operators` and `./collections` entries now re-export their modules with `export *`, and the root entry re-exports those two entries instead of listing their modules a second time. The exported names of all four entries are unchanged. Before, every operator and collection stood in three hand-maintained lists that nothing compared, so a new export in a core module reached the root entry and could miss its subpath entry in silence. `pnpm check` now also verifies that every value export of `./errors`, `./operators` and `./collections` reaches the root entry.
- A GitHub release now publishes the package. The workflow `release.yml` checks that the release tag matches the version in `package.json`, and it publishes through npm trusted publishing, so npm attaches a provenance attestation to the version. `SECURITY.md` describes this release pipeline and the other trust boundaries of the library.

### Fixed

- `collectFirstOkAsync()` and `collectFirstOkParallelAsync()` now validate every fulfilled value with `isResult()` and reject with `InvalidResultStateError` when an input fulfils with something that is not a Result. Previously the sequential variant, and the parallel variant when no `Ok` arrived, leaked a raw `TypeError` from calling `isOk()` on the value, and the parallel variant's first-Ok race swallowed that `TypeError` in its rejection guard, so a malformed input was hidden entirely whenever another input was observed as `Ok` first. An `Ok` that won the race before the malformed value was observed still wins.
- `collectFirstOkParallelAsync()` now rethrows a thunk's synchronous exception as a programmer error, as `collectFirstOkAsync()` always did. Previously the parallel variant deferred the thunk call into a promise chain, so a synchronous throw was silently collected as an error value, or hidden entirely when another input yielded `Ok`. Attempts that already started are abandoned without an unhandled rejection.
- The matcher builder classes `ErrorMatchBuilder`, `AsyncErrorMatchBuilder`, `ErrMatchBuilder`, and `AsyncErrMatchBuilder` are now exported as types from the root entry. They are the return types of `.matchError()`, `.matchErrorAsync()`, `.matchErr()`, and `.matchErrAsync()`, but a consumer could not name them: a library compiled with `declaration: true` that exported a function returning a builder failed with TS4094 and TS7056, and an explicit annotation was impossible because the import failed with TS2305. The package export check now compiles such a library consumer with declaration emit.
- `task()` now applies the yield protocol inside `finally` blocks that run during an `Err` short-circuit or before a `TaskYieldNotResultError`: `yield*` on an `Ok` receives the Ok value, an `Err` yielded there replaces the pending `Err` (as a `throw` inside `finally` replaces a pending exception) and skips the rest of that block while outer `finally` blocks still run, and a plain value yielded there throws `TaskYieldNotResultError`. Previously the cleanup was resumed with `undefined`, so `const conn = yield* ok(resource)` in a `finally` block produced a `TypeError` that hid the original `Err`, and an `Err` yielded during cleanup was silently dropped.
- `fromSerialized()` now accepts JSON payloads in which `JSON.stringify` dropped an `undefined` `value` or `error` key. Its docstring promises the shape that `JSON.stringify` produces for a Result, but the guards also demanded the key, so the payloads `{"_tag":"Ok"}` and `{"_tag":"Err"}` threw `InvalidResultStateError`. Every `Result<void, E>` that crossed a JSON boundary failed here, while the in-memory round trip through `toSerialized()` kept working, because that object always carries the key. The guards no longer demand that key, so `{ _tag: 'Ok' }` rebuilds as `Ok(undefined)` and `{ _tag: 'Err' }` as `Err(undefined)`. A truncated `Err` payload therefore rebuilds instead of failing at the parse point. A payload with an unknown `_tag` is still rejected, and so is one that carries an own key of the other state, including an explicit `error: undefined` on an `Ok`, which `structuredClone` and `postMessage` preserve although `JSON.stringify` drops it. Both this guard and `hasValidPayload()` in `isResult()` read own properties, so an inherited key does not reject a valid payload; `isResult()` still demands the payload key of the state, which this guard no longer does. A payload that throws while the envelope is read, for example a Proxy whose `getOwnPropertyDescriptor` trap throws, is rejected with `InvalidResultStateError` and carries the original error as its `cause`. An `Ok` payload without the `value` key rebuilds as `Ok(undefined)` for every `T`, so a truncated response arrives as a success that holds `undefined`; validate foreign payloads with your schema tool, as the deprecation notice says. The `toSerialized()` docstring, the README, the API reference, and the agent skill now state that `JSON.stringify` drops the `undefined` `value` key and that `ok(parsed.value)` rebuilds the value.
- Every error message that formats a payload now survives a value that cannot be converted to a string. `UnwrapOnErrError`, `UnwrapErrOnOkError`, `ExpectOkError`, `ExpectErrError`, `MatchTagMissingHandlerError` and `toUserFriendly()` ran `String(value)` on the payload, which calls the `toString`, `valueOf` or `Symbol.toPrimitive` of that value. An object with a null prototype has none of them, so `err(Object.create(null)).unwrap()` threw a raw `TypeError` with no `code`, and a hostile converter threw its own exception; a caller that matches on the code never saw the intended error. The payload is now described through a guarded conversion that falls back to `Object.prototype.toString`, and to `[unprintable <type>]` when the `Symbol.toStringTag` of the value throws as well.
- `toUserFriendly()` now also guards the access to the payload, not only its conversion. It read `'message' in error` and `error.message` outside the guard, so a `message` getter that throws, or a Proxy whose `has` trap throws, still escaped as a raw error without a `code`. Both cases now describe the error value itself.
- The API reference no longer documents a `fromResult(fn)` utility. The library never exported that name; `Result.try(fn)` and `Result.fromThrowable(fn, errorMapper?)` are the real exports and were already listed. `docs/api/errors.md` now carries `MatchTagMissingHandlerError` and `ERR_MATCH_TAG_MISSING_HANDLER`, which `matchTag()` throws and which the reference of the error classes left out. `pnpm docs:check` now guards both cases: every name that the API reference documents as an entry must be importable from the root entry, a documented namespace member such as `Result.try` must exist, and every error class and `ERR_` code of `src/errors.ts` must appear in the reference. Before, the gate only compiled the `ts` code fences, so drift in prose passed. The name check now reads every entry head, which covers the tables and the bare-name bullets of `docs/api/operators.md` as well, not only the list items that open with a call. The head is the leading run of code spans, so prose in the description of an entry is not mistaken for a claimed export, and fenced blocks are skipped, because they are compiled as examples.
- `sequenceRecord()` now skips a non-enumerable own property whose value is not a `Result`. It iterated `Reflect.ownKeys()` and demanded a `Result` behind every key, so a hidden helper field on an otherwise valid record threw `InvalidResultStateError` although the call type-checked. A non-enumerable property that holds a `Result` stays an input, because `keyof` does not skip it either, and dropping it would return an `Ok` whose object misses a key that its own type promises. Symbol keys stay supported. An array now throws instead of sequencing into an object keyed by its indices: its `length` is a non-enumerable non-`Result`, and a list of Results belongs to `sequence()`. A non-enumerable property that holds no `Result` stays ignored, even where the type of the record declares that key.

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
