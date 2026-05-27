# Changelog

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
- Documented the 1.0 decision to keep async composition on `Promise<Result<T, E>>` instead of adding a lazy async wrapper.
- Hardened `isResult` with a stable internal brand and `_tag`/payload validation instead of relying on `instanceof` only.
- Added `.matchError()` as the explicit name for Err-only fluent matching. `.match()` remains available as a compatibility alias.
- Added `.whenTag(key, value, handler)` to fluent matchers for discriminated-union error types.
- Added `.matchErrorAsync()` and `.matchErrAsync()` for fluent async matching.
- Removed the `matchErr()` footgun where naked handler return values were silently interpreted as `Err(value)`.
- Updated matcher documentation to use the actual `.when(...)` / `.whenGuard(...)` API.
