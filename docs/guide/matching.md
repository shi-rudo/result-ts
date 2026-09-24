# Pattern Matching

Use `.matchError()` for fluent Err-only matching after narrowing with `.isErr()`.

```ts
import { Result } from '@shirudo/result';

class NetworkError extends Error {
    readonly type = 'network';
}
class ValidationError extends Error {
    readonly type = 'validation';
}

const result: Result<never, NetworkError | ValidationError> = Result.err(new NetworkError('timeout'));

if (result.isErr()) {
    const message = result
        .matchError()
        .when(NetworkError, error => `Retry later: ${error.message}`)
        .when(ValidationError, error => `Invalid input: ${error.message}`)
        .otherwise(error => `Unexpected error: ${String(error)}`);
}
```

## Distinguishing Error Classes

The exhaustiveness check of `.run()` is structural. TypeScript cannot tell two classes of the same shape apart, so one `.when(...)` removes both from the remaining cases, `.run()` compiles, and the unhandled error is rethrown at runtime.

```ts
import { Result } from '@shirudo/result';

class NotFound extends Error {}
class Timeout extends Error {}

const result: Result<never, NotFound | Timeout> = Result.err(new Timeout('slow'));

if (result.isErr()) {
    result
        .matchError()
        .when(NotFound, () => 'not found')
        .run(); // compiles, throws the Timeout at runtime
}
```

Give each error class a distinguishing member. A literal `readonly code` works, and so does a private brand field such as `private readonly __timeout!: void`. The examples on this page use `readonly type` the same way.

```ts
import { Result } from '@shirudo/result';

class NotFound extends Error {
    readonly code = 'not-found';
}
class Timeout extends Error {
    readonly code = 'timeout';
}

const result: Result<never, NotFound | Timeout> = Result.err(new Timeout('slow'));

if (result.isErr()) {
    result
        .matchError()
        .when(NotFound, () => 'not found')
        .when(Timeout, () => 'timed out')
        .run(); // only compiles with both cases handled
}
```

Tagged unions matched with `.whenTag(...)` or `matchTag(...)` do not need this, because literal tags are always distinguishable.

## Discriminated Unions

Use `.whenTag(key, value, handler)` for tagged error unions.

```ts
import { Result } from '@shirudo/result';

type DomainError =
    | { code: 'network'; retryAfter: number }
    | { code: 'validation'; field: string };

const result = Result.err<DomainError>({ code: 'validation', field: 'email' });

if (result.isErr()) {
    const message = result
        .matchError()
        .whenTag('code', 'network', error => `Retry in ${error.retryAfter}s`)
        .whenTag('code', 'validation', error => `Invalid field: ${error.field}`)
        .run();
}
```

For object-style exhaustive handling, use `matchTag(result, key, handlers)`.

```ts
import { Result, matchTag } from '@shirudo/result';

type DomainError =
    | { code: 'network'; retryAfter: number }
    | { code: 'validation'; field: string };

const result = Result.err<DomainError>({ code: 'network', retryAfter: 30 });

const message = matchTag(result, 'code', {
    network: error => `Retry in ${error.retryAfter}s`,
    validation: error => `Invalid field: ${error.field}`,
});
```

## Transforming Err Values

Use `.matchErrorToResult()` when handlers should return a new `Result`. Handlers must explicitly return `ok(...)` or `err(...)`.

```ts
import { Result, err, ok } from '@shirudo/result';

class NetworkError extends Error {
    readonly type = 'network';
}
class ValidationError extends Error {
    readonly type = 'validation';
}

const recovered = Result.err<NetworkError | ValidationError, string>(new NetworkError('timeout'))
    .matchErrorToResult()
    .when(NetworkError, () => ok('cached fallback'))
    .when(ValidationError, error => err(error))
    .run();
```

The async variants are `.matchErrorAsync()` and `.matchErrorToResultAsync()`.
