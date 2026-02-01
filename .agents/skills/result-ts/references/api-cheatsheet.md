# `@shirudo/result` API Cheatsheet

A quick reference for the most common functions in the `@shirudo/result` library.

## Creating Results

### `ok(value)`

Creates a `Result` that is successful.

```typescript
import { ok } from '@shirudo/result';

const success = ok(123);
```

### `err(error)`

Creates a `Result` that has failed.

```typescript
import { err } from '@shirudo/result';

const failure = err('Something went wrong');
```

### `okIf(condition, value, error)`

Creates an `Ok` result with `value` if the condition is true, otherwise an `Err` with `error`.

```typescript
import { okIf } from '@shirudo/result';

const result = okIf(5 > 0, 5, 'not positive'); // ok(5)
```

### `okIfLazy(condition, okFn, errFn)`

Creates an `Ok` result with the value returned by `okFn` if the condition is true, otherwise an `Err` with the error returned by `errFn`. Both functions are lazily evaluated.

```typescript
import { okIfLazy } from '@shirudo/result';

const result = okIfLazy(true, () => 10, () => 'error'); // ok(10)
```

## Checking Results

### `isOk(result)`

Returns `true` if the result is `Ok`.

```typescript
import { ok, isOk } from '@shirudo/result';

const result = ok(123);
if (isOk(result)) {
  // result.value is 123
}
```

### `isErr(result)`

Returns `true` if the result is `Err`.

```typescript
import { err, isErr } from '@shirudo/result';

const result = err('Error');
if (isErr(result)) {
  // result.error is 'Error'
}
```

### `isResult(value)`

Checks whether a value is a `Result` type.

```typescript
import { ok, isResult } from '@shirudo/result';

const result = ok(123);
const notResult = 123;

console.log(isResult(result)); // true
console.log(isResult(notResult)); // false
```

### `contains(result, value)`

Checks if the `Result` contains a specific `Ok` value.

```typescript
import { ok, err, contains } from '@shirudo/result';

const success = ok(5);
console.log(contains(success, 5)); // true
console.log(contains(success, 10)); // false

const failure = err('error');
console.log(contains(failure, 5)); // false
```

### `containsErr(result, error)`

Checks if the `Result` contains a specific `Err` error.

```typescript
import { ok, err, containsErr } from '@shirudo/result';

const failure = err('error');
console.log(containsErr(failure, 'error')); // true
console.log(containsErr(failure, 'other error')); // false

const success = ok(5);
console.log(containsErr(success, 'error')); // false
```

## Transforming Results

### `map(mapper)`

Transforms the value of an `Ok` result. Does nothing for an `Err` result.

```typescript
import { ok, map } from '@shirudo/result';

const success = ok(5).pipe(map((n) => n * 2)); // ok(10)
```

### `mapErr(mapper)`

Transforms the error of an `Err` result. Does nothing for an `Ok` result.

```typescript
import { err, mapErr } from '@shirudo/result';

const failure = err('error').pipe(mapErr((s) => s.toUpperCase())); // err('ERROR')
```

### `mapBoth(mapOk, mapErr)` / `bimap(mapOk, mapErr)`

Transforms both the `Ok` value and the `Err` error, returning a new `Result`.

```typescript
import { ok, err, mapBoth } from '@shirudo/result';

const success = ok(5).pipe(mapBoth((n) => n * 2, (e) => e.toUpperCase())); // ok(10)
const failure = err('error').pipe(mapBoth((n) => n * 2, (e) => e.toUpperCase())); // err('ERROR')
```

### `flatMap(mapper)`

Chains operations that return a `Result`.

```typescript
import { ok, flatMap, Result, err } from '@shirudo/result';

const divide = (n: number): Result<number, string> =>
  n === 0 ? err('Cannot divide by zero') : ok(10 / n);

const result = ok(5).pipe(flatMap(divide)); // ok(2)
```

### `flatten(result)`

Flattens a nested `Result` (e.g., `Result<Result<T, E>, E>` to `Result<T, E>`).

```typescript
import { ok, err, flatten, Result } from '@shirudo/result';

const nestedOk = ok(ok(10)); // Result<Result<number, string>, string>
const flat = flatten(nestedOk); // ok(10)

const nestedErr = ok(err('inner error'));
const flatErr = flatten(nestedErr); // err('inner error')
```

### `swap(result)`

Swaps the `Ok` value and `Err` error of a `Result`.

```typescript
import { ok, err, swap } from '@shirudo/result';

const success = ok(123); // Ok<number, never>
const swappedSuccess = swap(success); // Err<never, number> -> err(123)

const failure = err('error'); // Err<never, string>
const swappedFailure = swap(failure); // Ok<string, never> -> ok('error')
```

## Validation

### `filter(predicate, error)`

If the `Ok` value satisfies the predicate, returns the original `Ok`. Otherwise, returns an `Err` with the specified `error`.

```typescript
import { ok, filter } from '@shirudo/result';

const result = ok(5).pipe(filter((n) => n > 0, 'not positive')); // ok(5)
```

### `tryMap(mapper)`

Like `flatMap`, but the mapper can throw an exception, which is caught and returned as an `Err`.

```typescript
import { ok, tryMap } from '@shirudo/result';

const result = ok('{"a": 1}').pipe(tryMap(JSON.parse)); // ok({a: 1})
```

## Handling Errors

### `orElse(fallback)`

Returns the original result if it is `Ok`, otherwise returns the result of the fallback function.

```typescript
import { err, ok, orElse } from '@shirudo/result';

const failure = err('error').pipe(orElse(() => ok('default'))); // ok('default')
```

### `recover(mapper)`

Recovers from an `Err` by mapping the error to a new `Ok` value.

```typescript
import { err, recover } from '@shirudo/result';

const result = err('error').pipe(recover(() => 'recovered')); // ok('recovered')
```

## Side Effects

### `tap(fn)`

Calls a function with the `Ok` value for side effects, without changing the `Result`.

```typescript
import { ok, tap } from '@shirudo/result';

const result = ok(5).pipe(tap(console.log)); // ok(5), and logs 5
```

## Combining Results

### `and(result, other)`

Returns `other` if `result` is `Ok`, otherwise returns `result`. Useful for short-circuiting on `Err`.

```typescript
import { ok, err, and } from '@shirudo/result';

const res1 = ok(10);
const res2 = ok('hello');
const res3 = err('first error');

console.log(and(res1, res2)); // ok('hello')
console.log(and(res3, res1)); // err('first error')
```

### `or(result, other)`

Returns `result` if `result` is `Ok`, otherwise returns `other`. Useful for providing a fallback `Result`.

```typescript
import { ok, err, or } from '@shirudo/result';

const res1 = ok(10);
const res2 = ok('fallback');
const res3 = err('error');

console.log(or(res1, res3)); // ok(10)
console.log(or(res3, res2)); // ok('fallback')
```

### `combine(...results)`

Combines multiple `Result`s into a single `Result` of a tuple. If any input is `Err`, the combined `Result` will be `Err` with the first error encountered. (Similar to `zip` but directly takes results).

```typescript
import { ok, err, combine } from '@shirudo/result';

const combined = combine(ok(1), ok('a'), ok(true)); // ok([1, 'a', true])
const combinedWithError = combine(ok(1), err('fail'), ok(true)); // err('fail')
```

## Unwrapping and Expecting Values

### `unwrap(result)`

Returns the value of an `Ok` result. Throws an `Error` if the result is `Err`.

```typescript
import { ok, unwrap } from '@shirudo/result';

const success = ok(5);
console.log(unwrap(success)); // 5
// unwrap(err('error')) will throw an Error
```

### `unwrapErr(result)`

Returns the error of an `Err` result. Throws an `Error` if the result is `Ok`.

```typescript
import { err, unwrapErr } from '@shirudo/result';

const failure = err('error');
console.log(unwrapErr(failure)); // 'error'
// unwrapErr(ok(5)) will throw an Error
```

### `unwrapOr(defaultValue)`

Unwraps an `Ok` result, or returns a default value if it's an `Err`.

```typescript
import { ok, err, unwrapOr } from '@shirudo/result';

const success = ok(5).pipe(unwrapOr(0)); // 5
const failure = err('error').pipe(unwrapOr(0)); // 0
```

### `unwrapOrDefault(result, defaultValue)`

Returns the value of an `Ok` result, or `defaultValue` if it is an `Err`. Alias for `unwrapOr`.

```typescript
import { ok, err, unwrapOrDefault } from '@shirudo/result';

const success = ok(5);
console.log(unwrapOrDefault(success, 0)); // 5
const failure = err('error');
console.log(unwrapOrDefault(failure, 0)); // 0
```

### `unwrapOrElse(fallback)`

Unwraps an `Ok` result, or computes a default value from the error if it's an `Err`.

```typescript
import { ok, err, unwrapOrElse } from '@shirudo/result';

const success = ok(5).pipe(unwrapOrElse(() => 0)); // 5
const failure = err('error').pipe(unwrapOrElse((e) => e.length)); // 5
```

### `unwrapOrThrow()`

Unwraps an `Ok` result, or throws the error if it's an `Err`.

```typescript
import { ok, err, unwrapOrThrow } from '@shirudo/result';

const success = ok(5).pipe(unwrapOrThrow()); // 5
```

### `expectResult(result, message)`

Returns the value of an `Ok` result. Throws an `Error` with the provided `message` if the result is `Err`.

```typescript
import { ok, expectResult } from '@shirudo/result';

const success = ok(5);
console.log(expectResult(success, 'Should be ok!')); // 5
// expectResult(err('error'), 'Should be ok!') will throw 'Should be ok!'
```

### `expectErr(result, message)`

Returns the error of an `Err` result. Throws an `Error` with the provided `message` if the result is `Ok`.

```typescript
import { err, expectErr } from '@shirudo/result';

const failure = err('error');
console.log(expectErr(failure, 'Should be an error!')); // 'error'
// expectErr(ok(5), 'Should be an error!') will throw 'Should be an error!'
```

## Async Operations

`'@shirudo/result'` provides async versions of many functions (`mapAsync`, `flatMapAsync`, `tryCatchAsync`, `foldAsync`, `matchAsync`, `tapAsync`, `filterAsync`, `mapErrAsync`, etc.) to work with `Promise<Result<T, E>>`.

```typescript
import { ok, flatMapAsync, Result } from '@shirudo/result';

const doubleAsync = async (n: number): Promise<Result<number, string>> => ok(n * 2);

const result = await ok(5).toAsync().pipe(flatMapAsync(doubleAsync)).toPromise(); // ok(10)
```

## Collections

### `sequence(results)`

Converts an array of `Result`s into a single `Result` of an array. If any input is `Err`, the combined `Result` will be `Err` with the *first* error encountered.

```typescript
import { sequence, ok, err } from '@shirudo/result';

const results = [ok(1), ok(2), ok(3)];
const result = sequence(results); // ok([1, 2, 3])

const resultsWithErr = [ok(1), err('bad'), ok(3)];
const resultWithErr = sequence(resultsWithErr); // err('bad')
```

### `sequenceRecord(record)`

Converts an object of `Result`s into a single `Result` of an object. If any input is `Err`, the combined `Result` will be `Err` with the first error encountered.

```typescript
import { sequenceRecord, ok, err } from '@shirudo/result';

const record = { a: ok(1), b: ok('hello') };
const result = sequenceRecord(record); // ok({ a: 1, b: 'hello' })

const recordWithError = { a: ok(1), b: err('fail') };
const resultWithError = sequenceRecord(recordWithError); // err('fail')
```

### `zip(...results)`

Zips multiple `Result`s into a single `Result` of a tuple. If any input is `Err`, the combined `Result` will be `Err` with the first error encountered. (Similar to `combine`).

```typescript
import { zip, ok, err } from '@shirudo/result';

const result = zip(ok(1), ok('hello')); // ok([1, 'hello'])
```

### `collectAllErrors(results)`

Combines a list of `Result`s. If all are `Ok`, it returns `Ok` with an array of values. If any are `Err`, it returns `Err` with an array of all errors.

```typescript
import { collectAllErrors, ok, err } from '@shirudo/result';

const results = [ok(1), ok(2), ok(3)];
const allOk = collectAllErrors(results); // ok([1, 2, 3])

const errors = [ok(1), err('e1'), ok(2), err('e2')];
const allErrors = collectAllErrors(errors); // err(['e1', 'e2'])
```

### `collectFirstOk(results)`

Parses a set of `Result`s, returning the first `Ok` encountered. If no `Ok` is found, returns an `Err` containing all collected errors.

```typescript
import { collectFirstOk, ok, err } from '@shirudo/result';

const firstOk = collectFirstOk([err('e1'), ok(2), err('e2')]); // ok(2)
const noOk = collectFirstOk([err('e1'), err('e2')]); // err(['e1', 'e2'])
```

### `partition(results)`

Partitions an array of `Result`s into two arrays: one containing `Ok` values and another containing `Err` errors.

```typescript
import { partition, ok, err } from '@shirudo/result';

const results = [ok(1), err('e1'), ok(2), err('e2')];
const [oks, errs] = partition(results); // oks: [1, 2], errs: ['e1', 'e2']
```

## Utility and Conversion Functions

### `fromNullable(value, error)`

Creates a `Result` from a nullable value.

```typescript
import { fromNullable } from '@shirudo/result';

const result = fromNullable(null, 'is null'); // err('is null')
```

### `fromResult(fn)`

Executes a function and catches any exceptions, wrapping the return value or caught error in a `Result`.

```typescript
import { fromResult, ok, err } from '@shirudo/result';

const success = fromResult(() => 10); // ok(10)
const failure = fromResult(() => { throw new Error('oops'); }); // err(Error('oops'))
```

### `tryCatch(fn, errorMapper)`

Catches a thrown error from `fn` and converts it to an `Err` result.

```typescript
import { tryCatch } from '@shirudo/result';

const result = tryCatch(() => JSON.parse('{')); // err(Error:...)
```

### `toNullable(result)`

Converts a `Result` to `T | null`. Returns the value if `Ok`, otherwise `null`.

```typescript
import { ok, err, toNullable } from '@shirudo/result';

const success = ok(5);
console.log(toNullable(success)); // 5
const failure = err('error');
console.log(toNullable(failure)); // null
```

### `toPromise()`

Converts a `Result` to a `Promise`. `Ok` becomes a resolved promise, `Err` becomes a rejected promise.

```typescript
import { ok } from '@shirudo/result';

const promise = ok(5).toPromise(); // Promise resolves with 5
```

### `fold(onOk, onErr)`

Takes two functions, one for `Ok` and one for `Err`, and returns the result of the applied function.

```typescript
import { ok, fold } from '@shirudo/result';

const text = ok(5).pipe(fold((n) => `Success: ${n}`, (e) => `Error: ${e}`)); // "Success: 5"
```

### `match(onOk, onErr)`

Similar to `fold`, but the functions are passed as properties of an object.

```typescript
import { ok, match } from '@shirudo/result';

const text = ok(5).pipe(match({ ok: (n) => `Success: ${n}`, err: (e) => `Error: ${e}` })); // "Success: 5"
```

## Result Object Instance Methods

These methods are available directly on `Ok` and `Err` instances.

### `result.isOk()`

Returns `true` if the `Result` instance is `Ok`.

```typescript
import { ok, err } from '@shirudo/result';

const success = ok(123);
console.log(success.isOk()); // true

const failure = err('Error');
console.log(failure.isOk()); // false
```

### `result.isErr()`

Returns `true` if the `Result` instance is `Err`.

```typescript
import { ok, err } from '@shirudo/result';

const success = ok(123);
console.log(success.isErr()); // false

const failure = err('Error');
console.log(failure.isErr()); // true
```

### `result.matchErr()`

Matches on the `Err` value via a `.when(...)` chain, allowing for specific error handling.

```typescript
import { err } from '@shirudo/result';

const result = err('PermissionDenied');
const message = result.matchErr().when('PermissionDenied', (e) => `Access denied: ${e}`).else((e) => `Generic error: ${e}`);
console.log(message); // "Access denied: PermissionDenied"
```

### `result.serialize()`

Serializes the `Result` instance into a simple object format `{ isSuccess: boolean; data?: T; error?: E }`, preserving original types.

```typescript
import { ok, err } from '@shirudo/result';

const success = ok(123);
console.log(success.serialize()); // { isSuccess: true, data: 123 }

const failure = err({ code: 404, message: 'Not Found' });
console.log(failure.serialize()); // { isSuccess: false, error: { code: 404, message: 'Not Found' } }
```

### `result.toUserFriendly()`

Serializes the `Result` instance into a user-friendly format `{ isSuccess: boolean; data?: T; error?: string }`, converting errors to readable strings.

```typescript
import { ok, err } from '@shirudo/result';

const success = ok(123);
console.log(success.toUserFriendly()); // { isSuccess: true, data: 123 }

const failure = err(new Error('Something went wrong'));
console.log(failure.toUserFriendly()); // { isSuccess: false, error: 'Something went wrong' }
```

---

**Note on Do-Notation (`[Symbol.iterator]`):**

The `Result` class also implements `[Symbol.iterator]`, which enables a generator-based "Do-notation" style of error handling for more ergonomic chaining of `Result`s in complex sequences. This is an advanced topic often used with libraries that provide a `task` runner. Due to its advanced nature and dependency on external runners, it is not detailed in this cheatsheet.