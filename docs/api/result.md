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
- `Result.sequence(results)`: Convert a tuple or array of Results into a Result of values.
- `Result.combine(left, right)`: Combine two Results and collect one or both errors in an array.
- `.toPromise()`: Convert `Ok` to a resolved promise and `Err` to a rejected promise.
- `.toNullable()`: Convert `Ok` to the value and `Err` to `null`.

## Instance Methods

- `.isOk()`: Type guard for `Ok`.
- `.isErr()`: Type guard for `Err`.
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
- `.matchErrorToResult()`: Transform Err cases while returning a `Result`.
- `.matchErrorToResultAsync()`: Async variant of `.matchErrorToResult()`.

The matcher methods return the builder types `ErrorMatchBuilder`, `AsyncErrorMatchBuilder`, `ErrorToResultMatchBuilder`, and `AsyncErrorToResultMatchBuilder`. The package exports them as types, so a function that returns a started builder can be annotated and compiled with `declaration: true`.
- `.toSerialized()`: Convert to the plain discriminated shape `{ _tag: 'Ok', value } | { _tag: 'Err', error }` (`SerializedResult<T, E>`), which `JSON.stringify` encodes exactly as it encodes the Result itself. Rebuild with `ok`/`err`. `JSON.stringify` drops a key whose value is `undefined`, so `Ok(undefined)` arrives as `{"_tag":"Ok"}` and `ok(parsed.value)` rebuilds it. `SerializedResult<T, E>` marks the payload key optional exactly where `T` or `E` admits `undefined`, so a schema typed as `SerializedResult<void, ApiError>` describes that payload. A generic helper over `SerializedResult<T, E>` reads the payload as `T | undefined`, because TypeScript cannot resolve the condition while `T` is a type parameter; rebuild with a cast there, or write the helper for a concrete payload type.
- `.toUserFriendly()`: Convert an Err to user-facing serialization with string error messages.

## Utilities

All APIs remain available from the package root. Focused subpath exports are also available for users who prefer narrower imports:

- `@shirudo/result/errors`
- `@shirudo/result/operators`
- `@shirudo/result/collections`

- `isResult(value)`: Check whether a value is a valid branded `Result` with a matching `_tag` and payload shape.
- `matchTag(result, key, handlers)`: Exhaustively match discriminated-union Err values by tag.
- `contains(result, value)`: Check whether an `Ok` contains a value.
- `containsErr(result, error)`: Check whether an `Err` contains an error.
