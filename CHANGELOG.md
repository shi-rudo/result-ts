# Changelog

## 1.0.0 - 2026-05-27

### Breaking Changes

- `matchErr()` handlers must now return a `Result` explicitly. Return `ok(value)` for recovery and `err(error)` for mapped errors.
- `matchErr().when(...)`, `matchErr().whenGuard(...)`, and `matchErr().otherwise(...)` now reject non-Result handler returns at runtime with `MatchErrHandlerNotResultError`.
- The package is promoted to the `1.0.0` major line.

### Fixed

- Removed the `matchErr()` footgun where naked handler return values were silently interpreted as `Err(value)`.
- Updated matcher documentation to use the actual `.when(...)` / `.whenGuard(...)` API.
