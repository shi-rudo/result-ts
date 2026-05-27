# Task Notation

`task()` lets you write sequential Result workflows in generator syntax. Use `yield*` to unwrap `Ok` values. If a yielded Result is `Err`, execution stops and that `Err` is returned.

```ts
import { err, ok, task } from '@shirudo/result';

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
const result = await task(
    function* () {
        const data = yield* fetchData();
        return process(data);
    },
    error => new CustomError(`Failed: ${String(error)}`),
);
```

## Common Footgun

Inside `task()`, use `yield* result`, not `yield result`.

```ts
const value = yield* getResult();
```

If a plain value is yielded, `task()` throws `TaskYieldNotResultError`.
