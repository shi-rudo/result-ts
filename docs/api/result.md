# Result API

## Creation and Conversion

- `ok(value)` / `err(error)`: Create basic Result instances.
- `okIf(condition, okValue, errValue)`: Conditionally create `Ok` or `Err`.
- `okIfLazy(condition, okFn, errFn)`: Lazy conditional creation.
- `Result.ok(value)` / `Result.err(error)`: Static factory variants.
- `Result.is(value)`: Check whether a value is a valid branded `Result`.
- `Result.try(fn)`: Execute a synchronous function and catch exceptions as `Err`.
- `Result.fromThrowable(fn, errorMapper?)`: Wrap a throwing function and return a function that produces `Result`.
- `Result.tryAsync(fn, errorMapper?)`: Execute an async function and catch rejections as `Err`.
- `Result.fromNullable(value, fallback)`: Convert `null | undefined` to `Err`.
- `Result.fromPromise(promise, errorMapper?)`: Convert a promise to `Promise<Result>`. Rejections become `Err`; exceptions thrown by `errorMapper` are rethrown.
- `Result.sequence(results)` / `Result.all(results)`: Convert a tuple or array of Results into a Result of values.
- `Result.combine(left, right)`: Combine two Results and collect one or both errors in an array.
- `.toPromise()`: Convert `Ok` to a resolved promise and `Err` to a rejected promise.
- `.toNullable()`: Convert `Ok` to the value and `Err` to `null`.

## Instance Methods

- `.isOk()`: Type guard for success.
- `.isErr()`: Type guard for failure.
- `.unwrap()`: Return the `Ok` value or throw `UnwrapOnErrError`.
- `.unwrapErr()`: Return the `Err` value or throw `UnwrapErrOnOkError`.
- `.unwrapOr(defaultValue)`: Return the `Ok` value or a default.
- `.unwrapOrElse(fn)`: Return the `Ok` value or compute a default from the error.
- `.unwrapOrThrow()`: Return the `Ok` value or throw the original error.
- `.expect(message)`: Return the `Ok` value or throw `ExpectOkError`.
- `.expectErr(message)`: Return the `Err` value or throw `ExpectErrError`.
- `.fold(onOk, onErr)`: Handle both states and return a single value.
- `.pipe(...)`: Chain synchronous operators.
- `.pipeAsync(...)`: Chain asynchronous operators.
- `.matchError()`: Start an Err-only fluent matcher after `.isErr()` narrowing.
- `.matchErrorAsync()`: Async variant of `.matchError()`.
- `.match()`: Compatibility alias for `.matchError()`.
- `.matchErr()`: Transform Err cases while returning a `Result`.
- `.matchErrAsync()`: Async variant of `.matchErr()`.
- `.serialize()`: Convert to `{ isSuccess, data?, error? }`.
- `.toUserFriendly()`: Convert an Err to user-facing serialization with string error messages.

## Utilities

- `isResult(value)`: Check whether a value is a valid branded `Result` with a matching `_tag` and payload shape.
- `contains(result, value)`: Check whether an `Ok` contains a value.
- `containsErr(result, error)`: Check whether an `Err` contains an error.
- `fromResult(fn)`: Execute a function and catch exceptions.
