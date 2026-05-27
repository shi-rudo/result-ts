# Pattern Matching

Use `.matchError()` for fluent Err-only matching after narrowing with `.isErr()`.

```ts
import { Result } from '@shirudo/result';

class NetworkError extends Error {}
class ValidationError extends Error {}

const result = Result.err(new NetworkError('timeout'));

if (result.isErr()) {
    const message = result
        .matchError()
        .when(NetworkError, error => `Retry later: ${error.message}`)
        .when(ValidationError, error => `Invalid input: ${error.message}`)
        .otherwise(error => `Unexpected error: ${String(error)}`);
}
```

`.match()` remains available as a compatibility alias for `.matchError()`.

## Discriminated Unions

Use `.whenTag(key, value, handler)` for tagged error unions.

```ts
type DomainError =
    | { type: 'network'; retryAfter: number }
    | { type: 'validation'; field: string };

const result = Result.err<DomainError>({ type: 'validation', field: 'email' });

if (result.isErr()) {
    const message = result
        .matchError()
        .whenTag('type', 'network', error => `Retry in ${error.retryAfter}s`)
        .whenTag('type', 'validation', error => `Invalid field: ${error.field}`)
        .run();
}
```

For object-style exhaustive handling, use `matchTag(result, key, handlers)`.

```ts
import { Result, matchTag } from '@shirudo/result';

type DomainError =
    | { type: 'network'; retryAfter: number }
    | { type: 'validation'; field: string };

const result = Result.err<DomainError>({ type: 'network', retryAfter: 30 });

const message = matchTag(result, 'type', {
    network: error => `Retry in ${error.retryAfter}s`,
    validation: error => `Invalid field: ${error.field}`,
});
```

## Transforming Err Values

Use `.matchErr()` when handlers should return a new `Result`. Handlers must explicitly return `ok(...)` or `err(...)`.

```ts
import { Result, err, ok } from '@shirudo/result';

const recovered = Result.err(new NetworkError('timeout'))
    .matchErr()
    .when(NetworkError, () => ok('cached fallback'))
    .when(ValidationError, error => err(error))
    .run();
```

The async variants are `.matchErrorAsync()` and `.matchErrAsync()`.
