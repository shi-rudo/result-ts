# Decision: Defensive state checks in every operator

## Status

Accepted (documented 2026-07, after the v1.0.2 code audit).

## Context

Nearly every operator and instance method follows the same three-branch pattern:

```ts docs-check:skip
if (source.isOk()) { /* Ok path */ }
if (source.isErr()) { /* Err path */ }
throw new InvalidResultStateError('map');
```

For genuine `Ok`/`Err` instances the third branch is unreachable: `_tag` is a
readonly literal (`'Ok' as const` / `'Err' as const`) and instances are frozen.
The audit flagged the pattern as duplicated dead code across ~40 files.

## Decision

The pattern stays, deliberately.

`Result` values regularly cross boundaries the type system cannot see:
deserialized payloads cast with `as unknown as Result<...>`, objects from
other library versions or realms, and hand-built mocks in consumer tests.
`isOk()`/`isErr()` are written against `_tag` — a malformed object where both
return `false` (or `_tag` is missing) would otherwise fall through operators
silently, producing `undefined` values far from the actual mistake. The
explicit `InvalidResultStateError` with its context string turns that into a
loud, located failure instead. The runtime cost is a branch that modern JITs
predict perfectly.

The dedicated test suite `src/core/invalid-state-operators.test.ts` exercises
these branches with malformed Result-likes, so they are covered, not dead.

## Consequences

- Every new operator must include the third branch with its context string.
- The duplication is accepted; a shared `assertResultState` helper was
  considered and rejected because it would obscure the per-callsite context
  string and add a call frame to every operator invocation for purely
  cosmetic savings.
- If TypeScript ever gains sound exhaustiveness at runtime boundaries, this
  decision should be revisited.
