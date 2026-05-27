# Changelog

## 1.0.0 - 2026-05-27

### Breaking Changes

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

- Added `.matchError()` as the explicit name for Err-only fluent matching. `.match()` remains available as a compatibility alias.
- Added `.whenTag(key, value, handler)` to fluent matchers for discriminated-union error types.
- Removed the `matchErr()` footgun where naked handler return values were silently interpreted as `Err(value)`.
- Updated matcher documentation to use the actual `.when(...)` / `.whenGuard(...)` API.
