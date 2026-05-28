# @shirudo/result

Robust, type-safe error handling for TypeScript.

`@shirudo/result` models expected failures as values instead of hidden exceptions. Functions return `Result<T, E>`, callers must handle both states, and TypeScript narrows access to `value` and `error` only when the state is known.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D20-green)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-1.0_ready-brightgreen.svg)

## Installation

```sh
npm install @shirudo/result
pnpm add @shirudo/result
yarn add @shirudo/result
```

## Quick Start

```ts
import { Result } from '@shirudo/result';

type User = { id: string; email: string; active: boolean };
type UserError =
    | { type: 'not-found'; id: string }
    | { type: 'inactive'; id: string };

const users = new Map<string, User>([
    ['1', { id: '1', email: 'ada@example.com', active: true }],
]);

function loadUser(id: string): Result<User, UserError> {
    const user = users.get(id);
    if (!user) return Result.err({ type: 'not-found', id });
    if (!user.active) return Result.err({ type: 'inactive', id });
    return Result.ok(user);
}

const result = loadUser('1');

if (result.isOk()) {
    console.log(result.value.email);
} else {
    switch (result.error.type) {
        case 'not-found':
            console.error(`Missing user ${result.error.id}`);
            break;
        case 'inactive':
            console.error(`Inactive user ${result.error.id}`);
            break;
    }
}
```

## Why This Library

- `Ok` does not expose `error`, and `Err` does not expose `value`; accidental reads require proper narrowing.
- `isResult` uses a stable internal brand plus payload validation instead of accepting random lookalike objects.
- `Result.fromPromise()` maps promise rejections but rethrows bugs inside the error mapper.
- Sync, async, generator, collection, and matching workflows are first-class.
- README and docs TypeScript snippets are compile-checked.
- Package exports are tested for ESM, CJS, and TypeScript consumers.

## Common Workflows

### Catch throwing APIs

```ts
import { Result } from '@shirudo/result';

const parseJson = Result.fromThrowable(
    JSON.parse,
    error => ({ type: 'parse' as const, cause: error }),
);

const parsed = parseJson('{"valid": true}');

const response = await Result.fromPromise(
    Promise.resolve({ ok: true }),
    error => ({ type: 'network' as const, cause: error }),
);
```

### Compose with pipe operators

```ts
import { Result } from '@shirudo/result';
import { filter, map, mapErr } from '@shirudo/result/operators';

const processed = Result.ok<number, string>(10).pipe(
    map(value => value * 2),
    filter(
        value => value > 25,
        () => 'too small',
    ),
    mapErr(error => `Validation failed: ${error}`),
);
```

### Compose async work

```ts
import { Result } from '@shirudo/result';
import { mapAsync, tryMapAsync } from '@shirudo/result/operators';

const db = {
    async getUser(id: number) {
        return { id, email: 'ada@example.com' };
    },
};

const normalizedEmail = await Result.ok<number, string>(1).pipeAsync(
    mapAsync(async id => db.getUser(id)),
    tryMapAsync(async user => user.email.toLowerCase()),
);
```

### Use task notation for sequential flows

```ts
import { Result, task } from '@shirudo/result';

function findUser(id: string) {
    return Result.ok({ id, email: 'ada@example.com' });
}

function ensureEmail(user: { id: string; email?: string }) {
    return user.email
        ? Result.ok(user.email)
        : Result.err({ type: 'missing-email' as const, id: user.id });
}

const email = task(function* () {
    const user = yield* findUser('1');
    return yield* ensureEmail(user);
});
```

### Match discriminated-union errors

```ts
import { Result, matchTag } from '@shirudo/result';

type DomainError =
    | { type: 'network'; retryAfter: number }
    | { type: 'validation'; field: string };

const failed = Result.err<DomainError>({ type: 'network', retryAfter: 30 });

const message = matchTag(failed, 'type', {
    network: error => `Retry in ${error.retryAfter}s`,
    validation: error => `Invalid field: ${error.field}`,
});
```

## Imports

Everything is available from the package root:

```ts
import { Result, err, ok, task } from '@shirudo/result';
```

Focused subpath exports are available for clearer imports and package-level checks:

```ts
import { UnwrapOnErrError } from '@shirudo/result/errors';
import { flatMapAsync, map } from '@shirudo/result/operators';
import { sequence, sequenceRecord } from '@shirudo/result/collections';
```

## Documentation

The full documentation lives in `docs/` and is built with VitePress.

- [Getting Started](docs/guide/getting-started.md)
- [Pipelines](docs/guide/pipelines.md)
- [Task Notation](docs/guide/task.md)
- [Pattern Matching](docs/guide/matching.md)
- [Result API](docs/api/result.md)
- [Operators](docs/api/operators.md)
- [Collections](docs/api/collections.md)
- [Error Classes](docs/api/errors.md)
- [Version 1 Migration](docs/migration/v1.md)
- [Design Decisions](docs/decisions/lazy-async-abstraction.md)

## Development

```sh
pnpm install
pnpm check
pnpm check:clean
```

Useful focused commands:

```sh
pnpm docs:dev
pnpm docs:check
pnpm test:exports
```

## License

MIT
