# Task Notation

`task()` lets you write sequential Result workflows in generator syntax. Use `yield*` to unwrap `Ok` values. If a yielded Result is `Err`, execution stops and that `Err` is returned.

```ts
import { err, ok, task } from '@shirudo/result';

function validate(value: number) {
    return value > 0 ? ok(value) : err('invalid value');
}

const calculate = task(function* () {
    const x = yield* ok(10);
    const y = yield* ok(20);
    const z = yield* validate(x + y);

    return z;
});
```

`calculate` resolves to `Result<number, E>` where `E` is inferred from yielded Results and mapped thrown errors.

## Mapping Thrown Errors

Use the optional `onThrow` callback to convert thrown exceptions into typed error values.

```ts
import { ok, task } from '@shirudo/result';

class CustomError extends Error {}

function fetchData() {
    return ok('raw data');
}

function processData(data: string) {
    return data.toUpperCase();
}

const result = await task(
    function* () {
        const data = yield* fetchData();
        return processData(data);
    },
    error => new CustomError(`Failed: ${String(error)}`),
);
```

Exceptions thrown inside a `finally` block are mapped by `onThrow` as well.

## Cleanup in `finally` Blocks

When a yielded Result is `Err`, `task()` resumes the generator as if it returned, so every `finally` block runs before the `Err` is returned. Inside a `finally` block, `yield*` works as in the body: an `Ok` sends its value back.

```ts
import { err, ok, task } from '@shirudo/result';

type Connection = { id: number };

function openConnection() {
    return ok({ id: 1 });
}

function loadUser(connection: Connection) {
    return connection.id > 0 ? err('user not found') : ok('user');
}

function closeConnection(connection: Connection) {
    return ok(`closed ${connection.id}`);
}

const log: string[] = [];

const result = await task(function* () {
    const connection = yield* openConnection();
    try {
        return yield* loadUser(connection);
    } finally {
        const status = yield* closeConnection(connection);
        log.push(status);
    }
});
```

`result` is `Err('user not found')`, and `log` holds `closed 1`.

An `Err` yielded inside a `finally` block replaces the pending `Err`, exactly as a `throw` inside `finally` replaces a pending exception. The rest of that `finally` block is skipped, and outer `finally` blocks still run. A plain value yielded inside a `finally` block throws `TaskYieldNotResultError` after the remaining `finally` blocks ran.

## Common Footgun

Inside `task()`, use `yield* result`, not `yield result`.

```ts
import { ok, task } from '@shirudo/result';

function getResult() {
    return ok(42);
}

const result = task(function* () {
    const value = yield* getResult();
    return value;
});
```

If a plain value is yielded, `task()` throws `TaskYieldNotResultError`.
