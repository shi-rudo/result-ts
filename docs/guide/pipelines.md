# Pipelines

Use `.pipe()` to compose synchronous operators. The first `Err` short-circuits the rest of the pipeline.

```ts
import { filter, map, mapErr, ok } from '@shirudo/result';

const processed = ok(10).pipe(
    map(value => value * 2),
    filter(
        value => value > 50,
        () => 'too small',
    ),
    mapErr(error => `Error: ${error}`),
);

console.log(processed.isErr()); // true
console.log(processed.unwrapOr(0)); // 0
```

## Async Pipelines

Use `.pipeAsync()` when one or more operators are async.

```ts
import { mapAsync, ok, tryMapAsync } from '@shirudo/result';

const result = await ok(1).pipeAsync(
    mapAsync(async id => {
        const user = await db.getUser(id);
        return user.name;
    }),
    tryMapAsync(async name => externalService.validate(name)),
);
```

## Terminal Operators

Use `fold` or `match` when a pipeline should end in a non-Result value.

```ts
import { fold, ok } from '@shirudo/result';

const message = ok(42).pipe(
    fold({
        ok: value => `Success: ${value}`,
        err: error => `Error: ${String(error)}`,
    }),
);
```
