# Error Classes

`Result` is designed for typed domain errors via `Err<E>`. The exported error classes are reserved for API misuse, unsafe unwrapping, invalid internal state, and integration mistakes.

All library error classes expose a stable `code` field. `ResultError` extends `Error`; `ResultTypeError` extends `TypeError`.

```ts
import {
    ERR_UNWRAP_ON_ERR,
    ResultTypeError,
    UnwrapOnErrError,
} from '@shirudo/result/errors';

try {
    result.unwrap();
} catch (error) {
    if (error instanceof UnwrapOnErrError && error.code === ERR_UNWRAP_ON_ERR) {
        console.error('Tried to unwrap an Err:', error.errorValue);
    }

    if (error instanceof ResultTypeError) {
        reportLibraryMisuse(error.code, error.message);
    }
}
```

| Class | Extends | Code | When it is thrown | Extra fields |
| :---- | :------ | :--- | :---------------- | :----------- |
| `InvalidResultStateError` | `ResultError` | `ERR_INVALID_RESULT_STATE` | A value is structurally invalid and is neither a valid `Ok` nor a valid `Err`. | `context?: string` |
| `TaskYieldNotResultError` | `ResultTypeError` | `ERR_TASK_YIELD_NOT_RESULT` | `task()` receives a yielded value that is not a `Result`; usually caused by `yield` instead of `yield*`. | `yieldedValue: unknown` |
| `MatchOnOkError` | `ResultTypeError` | `ERR_MATCH_ON_OK` | Err-only fluent matchers such as `.matchError()` are called on an `Ok`. | none |
| `MatchErrHandlerNotResultError` | `ResultTypeError` | `ERR_MATCH_ERR_HANDLER_NOT_RESULT` | A `.matchErr()` / `.matchErrAsync()` handler returns a naked value instead of `ok(...)` or `err(...)`. | `handlerName: string`, `returnedValue: unknown` |
| `UnwrapOnErrError` | `ResultTypeError` | `ERR_UNWRAP_ON_ERR` | `.unwrap()` is called on an `Err`. | `errorValue: unknown` |
| `UnwrapErrOnOkError` | `ResultTypeError` | `ERR_UNWRAP_ERR_ON_OK` | `.unwrapErr()` is called on an `Ok`. | `okValue: unknown` |
| `ExpectOkError` | `ResultError` | `ERR_EXPECT_OK` | `.expect(message)` is called on an `Err`. | `expectedMessage: string` |
| `ExpectErrError` | `ResultError` | `ERR_EXPECT_ERR` | `.expectErr(message)` is called on an `Ok`. | `expectedMessage: string` |

## Error Code Constants

- `ERR_INVALID_RESULT_STATE`
- `ERR_TASK_YIELD_NOT_RESULT`
- `ERR_MATCH_ON_OK`
- `ERR_MATCH_ERR_HANDLER_NOT_RESULT`
- `ERR_UNWRAP_ON_ERR`
- `ERR_UNWRAP_ERR_ON_OK`
- `ERR_EXPECT_OK`
- `ERR_EXPECT_ERR`

`ERR_INVALID_STATE` is exported as a backwards-compatible alias for `ERR_INVALID_RESULT_STATE`. Prefer `ERR_INVALID_RESULT_STATE` in new code.
