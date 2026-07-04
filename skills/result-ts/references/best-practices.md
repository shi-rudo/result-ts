# Best Practices for `@shirudo/result`

Every snippet in this file is compile-checked in CI (`pnpm docs:check`).

## 1. Use `Result` for Expected Failures, Keep Throwing for Bugs

Return a `Result` when the caller is expected to handle the failure (missing record, invalid input, network error). Keep throwing for programmer errors: broken invariants and failed assertions should crash loudly instead of being threaded through every signature.

## 2. Async Functions Return `Promise<Result<T, E>>`

There is no `AsyncResult` wrapper type in this library, by design (see `docs/decisions/lazy-async-abstraction.md`). Async functions simply return `Promise<Result<T, E>>`; compose them with `pipeAsync` and the `...Async` operators, or with `task`.

```typescript
import { fromPromise, type Result } from '@shirudo/result';
import { mapAsync } from '@shirudo/result/operators';

declare function fetchScore(id: string): Promise<number>;

async function loadScore(id: string): Promise<Result<number, { code: 'network'; cause: unknown }>> {
  const result = await fromPromise(fetchScore(id), cause => ({ code: 'network' as const, cause }));
  return result.pipeAsync(mapAsync(async score => score * 100));
}
```

## 3. Model Errors as Discriminated Unions with a `code` Field

A literal `code` discriminant lets the compiler narrow error branches and lets `matchTag`/`whenTag` match exhaustively. Use `code` (matching the library's own `ResultError.code` and the Node.js `err.code` convention), not `type`.

```typescript
import { err, ok, type Result } from '@shirudo/result';

type FileError =
  | { code: 'not-found'; path: string }
  | { code: 'permission-denied'; path: string };

declare function statFile(path: string): { readable: boolean } | undefined;

function readFile(path: string): Result<string, FileError> {
  const stat = statFile(path);
  if (!stat) return err({ code: 'not-found', path });
  if (!stat.readable) return err({ code: 'permission-denied', path });
  return ok('contents');
}
```

## 4. Compose on the Happy Path, Resolve Once at the End

Instead of checking after every step, chain steps with `flatMap`/`map` in a single `.pipe(...)` call and resolve with `match` at the end. Failures short-circuit past the remaining steps automatically.

```typescript
import { ok, type Result } from '@shirudo/result';
import { flatMap, map, match } from '@shirudo/result/operators';

declare function parse(input: string): Result<number, { code: 'parse' }>;
declare function validate(n: number): Result<number, { code: 'out-of-range' }>;

function process(input: string): string {
  return ok<string, never>(input).pipe(
    flatMap(parse),
    flatMap(validate),
    map(n => n * 2),
    match({
      ok: n => `Result: ${n}`,
      err: error => `Failed: ${error.code}`,
    }),
  );
}
```

## 5. Know the Two Calling Conventions

Operators from `@shirudo/result/operators` are curried and belong inside `.pipe(...)`. Utilities like `unwrapOr`, `mapOr`, `and`, `or` are data-first: they take the `Result` as their first argument and must be called directly. Putting a data-first utility inside a pipe does not compile.

```typescript
import { ok, unwrapOr } from '@shirudo/result';
import { map } from '@shirudo/result/operators';

const doubled = ok<number, string>(21).pipe(map(n => n * 2)); // curried operator in the pipe
const value = unwrapOr(doubled, 0);                           // data-first utility outside
```

## 6. Unwrap Only at the Edges

`unwrap`, `unwrapOr`, and `unwrapOrThrow` convert a `Result` back into a plain value and therefore give up the safety. Use them at the boundary of your application (controller, UI, CLI entry point), not in the middle of business logic. Inside the logic, keep returning `Result`.

```typescript
import { unwrapOr, type Result } from '@shirudo/result';
import { map } from '@shirudo/result/operators';

declare function findUser(id: number): Result<{ name: string }, { code: 'not-found' }>;

// Business logic stays inside Result:
function getUsername(id: number): Result<string, { code: 'not-found' }> {
  return findUser(id).pipe(map(user => user.name));
}

// The edge decides what a failure means concretely:
const displayName = unwrapOr(getUsername(1), 'Guest');
```

## 7. Require the Error Mapper When You Declare an Error Type

`fromPromise`, `tryAsync`, `fromThrowable`, `tryCatch`, `tryMap` and friends return `unknown` errors unless you pass an error mapper. Declaring an explicit error type without a mapper is a compile error, so always write the mapper together with the type:

```typescript
import { fromPromise } from '@shirudo/result';

type ApiError = { code: 'api'; cause: unknown };

declare const request: Promise<string>;

const result = await fromPromise<string, ApiError>(request, cause => ({ code: 'api', cause }));
```

## 8. Prefer `task` for Sequential, Branchy Flows

When a flow has intermediate variables and early exits, generator do-notation reads better than nested `flatMap` chains. `yield*` unwraps `Ok` values and short-circuits on the first `Err`.

```typescript
import { err, task, type Result } from '@shirudo/result';

declare function findUser(id: string): Result<{ email?: string }, { code: 'not-found' }>;
declare function sendMail(email: string): Result<void, { code: 'smtp' }>;

const sent = await task(function* () {
  const user = yield* findUser('1');
  if (!user.email) return yield* err({ code: 'no-email' as const });
  return yield* sendMail(user.email);
});
```

## 9. Cross Process Boundaries with `toSerialized()`

Result instances carry methods and a brand, so raw `JSON.parse` output is not a `Result`. Serialize with `toSerialized()` and rebuild with `fromSerialized()`; validate foreign values with `isResult()`.

```typescript
import { ok, fromSerialized, isResult } from '@shirudo/result';

const wire = JSON.stringify(ok({ id: 1 }).toSerialized());
const restored = fromSerialized<{ id: number }, never>(JSON.parse(wire));

console.log(isResult(restored)); // true
console.log(isResult(JSON.parse(wire))); // false: plain data, not a Result
```
