# @shirudo/result

A `Result<T, E>` type for TypeScript. Functions return their failures instead of throwing them.

```ts docs-check:skip
function loadUser(id: string): Result<User, UserError>
```

The failure is part of the signature: callers see exactly what can go wrong, the compiler insists both cases are handled, and `value`/`error` are only accessible after narrowing. What used to be a forgotten `catch` is now a type error.

The rest of the package is tooling around that one type: pipe operators, async variants, generator-based do-notation, exhaustive error matching, and collection helpers. The library has zero dependencies, ships as ESM and CJS, and runs on Node 20+ and edge runtimes.

[![CI](https://github.com/shi-rudo/result-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/shi-rudo/result-ts/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@shirudo/result.svg)](https://www.npmjs.com/package/@shirudo/result)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-green.svg)](https://nodejs.org/)
![Edge Runtime](https://img.shields.io/badge/Edge_Runtime-compatible-brightgreen.svg)

## Installation

```sh
npm install @shirudo/result
pnpm add @shirudo/result
yarn add @shirudo/result
```

## Quick Start

```ts
import { err, ok, type Result } from '@shirudo/result';
import { map, match } from '@shirudo/result/operators';

type User = { id: string; email: string; active: boolean };
type UserError =
    | { type: 'not-found'; id: string }
    | { type: 'inactive'; id: string };

const users = new Map<string, User>([
    ['1', { id: '1', email: 'ada@example.com', active: true }],
]);

function loadUser(id: string): Result<User, UserError> {
    const user = users.get(id);
    if (!user) return err({ type: 'not-found', id });
    if (!user.active) return err({ type: 'inactive', id });
    return ok(user);
}

// Narrow explicitly:
const result = loadUser('1');
if (result.isOk()) {
    console.log(result.value.email); // `value` is only accessible in this branch
}

// Or compose and resolve in one expression. `map` only runs on Ok,
// and the error keeps its type all the way to `match`:
const message = loadUser('1').pipe(
    map(user => `Welcome back, ${user.email}`),
    match({
        ok: greeting => greeting,
        err: error =>
            error.type === 'not-found'
                ? `No user with id ${error.id}`
                : `User ${error.id} is deactivated`,
    }),
);
```

## Why Result Instead of try/catch?

TypeScript cannot type a `catch` block: every thrown value arrives as `unknown`, and nothing in a function's signature reveals that it throws at all. Callers either remember to catch, or they find out in production.

A `Result<User, UserError>` puts the failure into the signature. The compiler forces both states to be handled, narrows `value` and `error` access to the matching state (as in the Quick Start above), and keeps the error type intact across every transformation.

## Why This Library?

There are several Result implementations for TypeScript. This one is built around a few hard guarantees:

- **Error types that cannot lie.** Declaring an explicit error type requires an error mapper: `fromPromise<User, ApiError>(promise)` without one is a compile error, so `E` never silently holds an unmapped `unknown`. And bugs inside the mapper itself are rethrown instead of being disguised as `Err` values.
- **Exhaustive matching, checked at compile time.** `matchError().when(NotFoundError, ...).run()` only compiles once every error case is handled, and `matchTag` does the same for discriminated unions. Add a new error variant, and every unhandled match site turns red.
- **Four interchangeable styles, one type.** Explicit `isOk()`/`isErr()` checks, `pipe`/`pipeAsync` operator chains, generator-based do-notation (`task`), and builder-based error matching all work on the same immutable, frozen `Result`. Use whichever style fits each call site.
- **Safe at runtime boundaries.** `isResult()` validates an internal brand plus payload shape instead of accepting lookalike objects, and `toSerialized()`/`fromSerialized()` round-trip Results through JSON without ambiguity.
- **Zero dependencies, runs anywhere.** The package ships ESM and CJS builds with tree-shakeable subpath exports, and it runs on Node 20+ and in edge runtimes.
- **Verified, not promised.** Every TypeScript snippet in this README and the docs is compile-checked in CI, the API is covered by 400+ runtime tests plus compile-time type tests, and the package exports are verified for ESM, CJS, and TypeScript consumers.

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
- [Design Decisions](docs/decisions/lazy-async-abstraction.md) ([Defensive State Checks](docs/decisions/defensive-state-checks.md))

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
