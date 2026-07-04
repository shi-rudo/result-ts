# `@shirudo/result` API Cheatsheet

Every snippet in this file is compile-checked in CI (`pnpm docs:check`).

Two calling conventions exist, and mixing them up is the most common mistake:

- **Curried operators** (from `@shirudo/result/operators`) take their configuration and return a function `Result => ...`. Use them inside `.pipe(...)` / `.pipeAsync(...)`: `map`, `mapErr`, `mapBoth`/`bimap`, `flatMap`, `tap`, `filter`, `fold`, `match`, `recover`, `recoverWith`, `tryCatch`, `tryMap`, and their `...Async` variants.
- **Data-first utilities** take the `Result` as their first argument and are called directly, never inside a pipe: `unwrap`, `unwrapOr`, `unwrapOrElse`, `unwrapOrThrow`, `unwrapErr`, `expectResult`, `expectErr`, `mapOr`, `mapOrElse`, `and`, `or`, `orElse`, `swap`, `flatten`, `contains`, `containsErr`, `isOk`, `isErr`, `toNullable`, `toPromise`, and all collection helpers.

## Creating Results

```typescript
import { ok, err, okIf, okIfLazy, fromNullable } from '@shirudo/result';

const success = ok(42); // Result<number, never>
const failure = err({ code: 'not-found' as const, id: '7' });

const checked = okIf(2 + 2 === 4, 'value', 'error');
const lazyChecked = okIfLazy(2 + 2 === 4, () => 'value', () => 'error');

const maybe: string | undefined = undefined;
const fromMaybe = fromNullable(maybe, 'was nullish'); // Result<string, string>
```

## Catching Exceptions and Promises

Without an error mapper the error type is `unknown`. Declaring an explicit error type **requires** the mapper; `fromPromise<T, MyError>(promise)` without one is a compile error. Bugs thrown inside the mapper itself are rethrown, not converted to `Err`.

```typescript
import { Result, tryFn, tryAsync, fromPromise, fromThrowable } from '@shirudo/result';

const parsedUnknown = tryFn(() => JSON.parse('{}')); // Result<any, unknown>

const parseJson = fromThrowable(
  JSON.parse,
  cause => ({ code: 'parse' as const, cause }),
);
const parsed = parseJson('{"valid":true}'); // Result<any, { code: 'parse'; cause: unknown }>

const response = await fromPromise(
  Promise.resolve('body'),
  cause => ({ code: 'network' as const, cause }),
);

const loaded = await tryAsync(
  async () => 'payload',
  cause => ({ code: 'io' as const, cause }),
);

// The same functions exist on the Result namespace:
const viaNamespace = Result.try(() => 1);
```

## Checking

`contains`/`containsErr` compare with `Object.is`: `NaN` matches `NaN`, objects match by reference.

```typescript
import { ok, err, isOk, isErr, isResult, contains, containsErr } from '@shirudo/result';

const result = ok<number, string>(5);

if (result.isOk()) console.log(result.value); // instance method narrows
if (isOk(result)) console.log(result.value);  // function form narrows too

console.log(isErr(result));                   // false
console.log(isResult(result));                // true, brand + payload validation
console.log(contains(result, 5));             // true
console.log(containsErr(err('boom'), 'boom')); // true
```

## Transforming (curried, use inside `.pipe`)

```typescript
import { ok, err, type Result } from '@shirudo/result';
import { map, mapErr, mapBoth, flatMap, filter, tap, recover, recoverWith, tryMap, tryCatch } from '@shirudo/result/operators';

declare function findQuota(user: string): Result<number, { code: 'no-quota'; user: string }>;

const outcome = ok<string, { code: 'no-quota'; user: string }>('ada').pipe(
  flatMap(findQuota),                                // chain a Result-returning step
  map(quota => quota * 2),                           // transform the Ok value
  filter(quota => quota > 0, () => ({ code: 'no-quota' as const, user: 'ada' })),
  tap({ ok: quota => console.log('quota', quota) }), // side effects; observer object with optional ok/err
  mapErr(error => `failed for ${error.user}`),       // transform the error
);

const stringified = ok<number, string>(1).pipe(
  tryMap(n => JSON.stringify(n)),                    // like map, but catches throws (error widens to unknown)
);

const swappedSides = ok<number, string>(1).pipe(
  mapBoth(n => n + 1, e => `error: ${e}`),           // transform both sides at once
);

const recovered = err<'boom', number>('boom').pipe(
  recover(0),                                        // Err -> Ok(0), error type becomes never
);
const recoveredWith = err<'boom', number>('boom').pipe(
  recoverWith(error => error.length),                // compute the fallback from the error
);

const chained = ok<number, never>(1).pipe(
  tryCatch(() => JSON.parse('{}')),                  // runs only when the source is Ok, catches throws
);
```

## Resolving a Pipe

`match` and `fold` end a pipe; both take an `{ ok, err }` handler object.

```typescript
import { err } from '@shirudo/result';
import { map, match } from '@shirudo/result/operators';

const text = err<'nope', number>('nope').pipe(
  map(n => n + 1),
  match({
    ok: n => `Success: ${n}`,
    err: e => `Error: ${e}`,
  }),
); // "Error: nope"
```

## Unwrapping (data-first, call at the edges)

```typescript
import { ok, err, unwrap, unwrapErr, unwrapOr, unwrapOrElse, unwrapOrThrow, expectResult, expectErr } from '@shirudo/result';

const success = ok<number, string>(5);
const failure = err<string, number>('boom');

console.log(unwrap(success));                 // 5; throws UnwrapOnErrError on Err
console.log(unwrapErr(failure));              // 'boom'; throws UnwrapErrOnOkError on Ok
console.log(unwrapOr(failure, 0));            // 0
console.log(unwrapOrElse(failure, e => e.length)); // 4
console.log(expectResult(success, 'must have config')); // 5; ExpectOkError carries the Err payload as `cause`

let rethrown: unknown;
try {
  unwrapOrThrow(failure);                     // throws the original error value, stack intact
} catch (error) {
  rethrown = error;
}

const errorValue = expectErr(failure, 'wanted the error'); // 'boom'
```

## Combinators (data-first)

```typescript
import { ok, err, and, or, orElse, mapOr, mapOrElse, swap, flatten, type Result } from '@shirudo/result';

const a = ok<number, string>(1);
const b = ok<string, string>('two');

console.log(and(a, b));                        // Ok('two'): second result if the first is Ok
console.log(or(err<string, number>('x'), a));  // Ok(1): fallback if the first is Err
console.log(orElse(err<string, number>('x'), e => ok<number, never>(e.length))); // lazy fallback

console.log(mapOr(a, 0, n => n * 2));          // 2; default when Err
console.log(mapOrElse(a, e => e.length, n => n * 2)); // compute the default from the error

console.log(swap(a));                          // Ok(1) -> Err(1)

const nested: Result<Result<number, string>, string> = ok(ok(1));
console.log(flatten(nested));                  // Ok(1)
```

## Zip and Combine

Both take exactly **two** Results (or one, returning a curried function for pipes). `zip` short-circuits on the first `Err`; `combine` collects **both** errors into an array.

```typescript
import { ok, err, zip, combine } from '@shirudo/result';

const zipped = zip(ok<number, 'l'>(1), ok<string, 'r'>('a'));       // Ok([1, 'a'])
const zipShort = zip(err<'l', number>('l'), err<'r', string>('r')); // Err('l')

const both = combine(err<'l', number>('l'), err<'r', string>('r')); // Err(['l', 'r'])

const curried = ok<number, 'l'>(1).pipe(zip(ok<string, 'r'>('a'))); // Ok([1, 'a'])
```

## Collections

```typescript
import { ok, err, sequence, sequenceRecord, collectAllErrors, collectFirstOk, partition } from '@shirudo/result';

const results = [ok<number, string>(1), ok<number, string>(2)] as const;

const all = sequence(results);                  // Ok([1, 2]); first Err short-circuits
const record = sequenceRecord({ a: ok<number, string>(1), b: ok<string, string>('x') }); // Ok({ a: 1, b: 'x' })
const collected = collectAllErrors(results);    // Ok values, or Err with every error
const firstOk = collectFirstOk([err<string, number>('a'), ok<number, string>(2)]); // Ok(2), else Err(allErrors)
const [oks, errs] = partition([ok<number, string>(1), err<string, number>('e')]);
```

Async variants take promises or thunks: `collectFirstOkAsync` runs them sequentially, `collectFirstOkParallelAsync` starts all and resolves with the first `Ok`.

```typescript
import { ok, err, collectFirstOkAsync, collectFirstOkParallelAsync } from '@shirudo/result';

const sequential = await collectFirstOkAsync([
  () => Promise.resolve(err<'a', number>('a')),
  () => Promise.resolve(ok<number, 'b'>(2)),
]); // Ok(2); thunks after the first Ok are never started

const parallel = await collectFirstOkParallelAsync([
  Promise.resolve(err<'a', number>('a')),
  Promise.resolve(ok<number, 'b'>(2)),
]); // Ok(2); all inputs start immediately
```

## Async Composition

Functions return `Promise<Result<T, E>>` by design; there is no lazy async wrapper type (see `docs/decisions/lazy-async-abstraction.md`). Compose with `pipeAsync` and the `...Async` operators.

```typescript
import { ok } from '@shirudo/result';
import { mapAsync, flatMapAsync, tryMapAsync, matchAsync } from '@shirudo/result/operators';

declare const db: { getUser(id: number): Promise<{ email: string }> };

const message = await ok<number, string>(1).pipeAsync(
  mapAsync(async id => db.getUser(id)),
  flatMapAsync(async user => ok<string, string>(user.email)),
  tryMapAsync(async email => email.toLowerCase()),
  matchAsync({
    ok: async email => `ok: ${email}`,
    err: async error => `failed: ${String(error)}`,
  }),
);
```

## Do-Notation with `task`

`yield*` unwraps `Ok` values and short-circuits on the first `Err`. Works with sync and async generators; `finally` blocks run before the short-circuit returns. The optional second argument maps thrown exceptions to a typed `Err`.

```typescript
import { err, task, type Result } from '@shirudo/result';

declare function findUser(id: string): Result<{ id: string; email?: string }, { code: 'not-found' }>;

const emailResult = await task(function* () {
  const user = yield* findUser('1');
  if (!user.email) return yield* err({ code: 'missing-email' as const });
  return user.email;
});

const guarded = await task(
  async function* () {
    const user = yield* findUser('1');
    return user.id;
  },
  cause => ({ code: 'crashed' as const, cause }),
);
```

## Error Matching

`matchTag(result, key, handlers)` matches a discriminated-union error exhaustively. It must only be called on an `Err` (it throws `MatchOnOkError` on `Ok`); a tag without a handler throws `MatchTagMissingHandlerError`.

```typescript
import { Result, matchTag } from '@shirudo/result';

type DomainError =
  | { code: 'network'; retryAfter: number }
  | { code: 'validation'; field: string };

const failed = Result.err<DomainError>({ code: 'network', retryAfter: 30 });

const message = matchTag(failed, 'code', {
  network: error => `Retry in ${error.retryAfter}s`,
  validation: error => `Invalid: ${error.field}`,
});
```

The fluent builders live on the instance. `matchError()` is Err-only (call it after narrowing with `isErr()`); `run()` only compiles once every error case is handled, `otherwise(...)` handles the rest. Error classes need a distinguishing member (like a literal `code`), otherwise structural typing cannot tell them apart.

```typescript
import { Result } from '@shirudo/result';

class NetworkError extends Error {
  readonly code = 'network';
}
class ValidationError extends Error {
  readonly code = 'validation';
}

const outcome: Result<never, NetworkError | ValidationError> = Result.err(new NetworkError('timeout'));

if (outcome.isErr()) {
  const message = outcome
    .matchError()
    .when(NetworkError, error => `Retry later: ${error.message}`)
    .whenGuard((error): error is ValidationError => error instanceof ValidationError, error => `Invalid: ${error.message}`)
    .run(); // compiles because both cases are handled
}
```

`matchErr()` is the variant whose handlers must return a `Result` (wrap with `ok(...)` to recover, `err(...)` to map). `matchErrorAsync()`/`matchErrAsync()` accept async handlers; they run lazily on the first awaited `run()`/`otherwise()`.

```typescript
import { ok, Result } from '@shirudo/result';

class CacheMissError extends Error {
  readonly code = 'cache-miss';
}

const cached = Result.err<CacheMissError, number>(new CacheMissError())
  .matchErr()
  .when(CacheMissError, () => ok(0)) // recover with a default
  .run(); // Result<number, never>
```

## Serialization

`toSerialized()` round-trips through `fromSerialized()`, including `Ok(undefined)`. The older `serialize()` is deprecated because its format cannot round-trip.

```typescript
import { ok, fromSerialized } from '@shirudo/result';

const wire = ok(42).toSerialized();       // { _tag: 'Ok', value: 42 }
const restored = fromSerialized(wire);    // a real Result instance again
console.log(restored.unwrapOr(0));        // 42

const friendly = ok(42).toUserFriendly(); // { isSuccess: true, data: 42 }
```

## Error Classes

All library errors extend `ResultError` or `ResultTypeError` and carry a stable `code`:

```typescript
import { err } from '@shirudo/result';
import { UnwrapOnErrError, ERR_UNWRAP_ON_ERR } from '@shirudo/result/errors';

try {
  err('boom').unwrap();
} catch (error) {
  if (error instanceof UnwrapOnErrError) {
    console.log(error.code === ERR_UNWRAP_ON_ERR); // true
    console.log(error.errorValue);                 // 'boom'
  }
}
```

Codes: `ERR_UNWRAP_ON_ERR`, `ERR_UNWRAP_ERR_ON_OK`, `ERR_EXPECT_OK`, `ERR_EXPECT_ERR`, `ERR_MATCH_ON_OK`, `ERR_MATCH_TAG_MISSING_HANDLER`, `ERR_MATCH_ERR_HANDLER_NOT_RESULT`, `ERR_TASK_YIELD_NOT_RESULT`, `ERR_INVALID_RESULT_STATE`.

## Deprecated

- `serialize()`: use `toSerialized()`/`fromSerialized()`.
- `unwrapOrDefault(result, value)`: alias of `unwrapOr` with a misleading name.
- `ERR_INVALID_STATE`: use `ERR_INVALID_RESULT_STATE`.
- Instance `match()`: use `matchError()` (Err-only builder) or the `match({ ok, err })` pipe operator.

## Subpath Exports

```typescript
import { Result, ok, err, task } from '@shirudo/result';
import { map, flatMapAsync } from '@shirudo/result/operators';
import { sequence, sequenceRecord } from '@shirudo/result/collections';
import { ResultError } from '@shirudo/result/errors';
```
