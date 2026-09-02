# Collections

Collection helpers compose multiple Results.

```ts
import { sequence, sequenceRecord } from '@shirudo/result/collections';
```

- `sequence(results)`: Convert `Result<T, E>[]` to `Result<T[], E>`. The first error stops the process.
- `all(results)`: Alias for `sequence`.
- `sequenceRecord(record)`: Convert a record of Results to a Result of record values.
- `collectFirstOk(results)`: Return the first success, or all errors if none succeed.
- `collectFirstOkAsync(inputs, errorMapper?)`: Async sequential version of `collectFirstOk`. Inputs are promises or thunks. A rejected input counts as a failed attempt: without `errorMapper` the collected errors are `unknown[]`, with `errorMapper` each rejection reason becomes a typed error next to the `Err` values.
- `collectFirstOkParallelAsync(inputs, errorMapper?)`: Parallel variant where the first success wins. Same input and `errorMapper` contract as `collectFirstOkAsync`.
- `collectAllErrors(results)`: Return all values only if every Result is `Ok`; otherwise collect all errors.
- `partition(results)`: Split Results into `[oks, errs]`.
- `flatten(result)`: Flatten `Result<Result<T, E>, E>` to `Result<T, E>`.

```ts
import { err, ok } from '@shirudo/result';
import { collectAllErrors, sequenceRecord } from '@shirudo/result/collections';

sequenceRecord({
    id: ok(1),
    name: ok('Ada'),
}); // Ok({ id: 1, name: 'Ada' })

collectAllErrors([ok(1), err('a'), err('b')]); // Err(['a', 'b'])
```
