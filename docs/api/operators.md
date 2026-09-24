# Operators

Import pipeable operators from the package root or from `@shirudo/result/operators` and pass them to `.pipe()` or `.pipeAsync()`.

```ts
import { map, flatMapAsync } from '@shirudo/result/operators';
```

## Synchronous Operators

| Operator | Description |
| :------- | :---------- |
| `map(fn)` | Transform the `Ok` value. |
| `mapErr(fn)` | Transform the `Err` value. |
| `mapBoth(fnOk, fnErr)` | Transform both states. |
| `flatMap(fn)` | Chain a function that returns a `Result`. |
| `filter(predicate, errFn)` | Turn `Ok` into `Err` if the predicate fails. |
| `tap(observer)` | Run side effects without changing the Result. |
| `recover(value)` | Convert `Err` to `Ok` with a default value. |
| `recoverElse(fn)` | Convert `Err` to `Ok` using the error value. |
| `tryCatch(fn)` | Run a function and catch exceptions into `Err`. |
| `tryMap(fn)` | Like `map`, but catches exceptions. |
| `fold({ ok, err })` | End a pipe and return a value based on state. |

## Async Operators

- `mapAsync`
- `mapErrAsync`
- `flatMapAsync`
- `filterAsync`
- `tapAsync`
- `tryCatchAsync`
- `tryMapAsync`
- `foldAsync`

## Combinators

A combinator takes the Result as its first argument. Leave the Result out, and it returns a function for `.pipe()`. `swap` and `flatten` take only the Result, so they go into `.pipe()` without a call.

| Combinator | Description |
| :--------- | :---------- |
| `and(right)` / `and(left, right)` | Return `right` only if `left` is `Ok`. |
| `or(right)` / `or(left, right)` | Return `left` if it is `Ok`; otherwise return `right`. |
| `orElse(fn)` / `orElse(result, fn)` | Return the original `Ok`; otherwise call `fn(error)`. |
| `swap(result)` | Swap `Ok<T>` and `Err<E>` into `Result<E, T>`. |
| `flatten(result)` | Flatten `Result<Result<T, E>, E>` to `Result<T, E>`. |
| `zip(right)` / `zip(left, right)` | Combine two `Ok` values into a tuple, short-circuiting on the first `Err`. |
| `combine(right)` / `combine(left, right)` | Combine two Results and collect one or both errors in an array. |

```ts
import { combine, err, ok, or, zip } from '@shirudo/result';

zip(ok(1), ok('a')); // Ok([1, 'a'])
combine(err('left'), err('right')); // Err(['left', 'right'])
err<string, number>('missing').pipe(or(ok(0))); // Ok(0)
```
