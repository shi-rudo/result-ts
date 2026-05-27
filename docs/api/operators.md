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
| `bimap(fnOk, fnErr)` | Alias for `mapBoth`. |
| `flatMap(fn)` | Chain a function that returns a `Result`. |
| `filter(predicate, errFn)` | Turn `Ok` into `Err` if the predicate fails. |
| `tap(observer)` | Run side effects without changing the Result. |
| `recover(value)` | Convert `Err` to `Ok` with a default value. |
| `recoverWith(fn)` | Convert `Err` to `Ok` using the error value. |
| `tryCatch(fn)` | Run a function and catch exceptions into `Err`. |
| `tryMap(fn)` | Like `map`, but catches exceptions. |
| `fold({ ok, err })` | End a pipe and return a value based on state. |
| `match({ ok, err })` | Pipe matcher for both states. |

## Async Operators

- `mapAsync`
- `mapErrAsync`
- `flatMapAsync`
- `filterAsync`
- `tapAsync`
- `tryCatchAsync`
- `tryMapAsync`
- `foldAsync`
- `matchAsync`

## Combinators

| Combinator | Description |
| :--------- | :---------- |
| `and(left, right)` | Return `right` only if `left` is `Ok`. |
| `or(left, right)` | Return `left` if it is `Ok`; otherwise return `right`. |
| `orElse(result, fn)` | Return the original `Ok`; otherwise call `fn(error)`. |
| `mapOr(result, defaultValue, fn)` | Map `Ok` or return the default value. |
| `mapOrElse(result, defaultFn, fn)` | Map `Ok` or compute the default from the error. |
| `swap(result)` | Swap `Ok<T>` and `Err<E>` into `Result<E, T>`. |
| `zip(left, right)` | Combine two `Ok` values into a tuple, short-circuiting on the first `Err`. |
| `combine(left, right)` | Combine two Results and collect one or both errors in an array. |

```ts
import { combine, err, ok, zip } from '@shirudo/result';

zip(ok(1), ok('a')); // Ok([1, 'a'])
combine(err('left'), err('right')); // Err(['left', 'right'])
```
