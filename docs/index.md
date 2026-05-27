# @shirudo/result

Robust, type-safe error handling for TypeScript.

`@shirudo/result` brings the Result pattern to TypeScript. It helps you model expected failures as values instead of hidden exceptions, so callers must handle success and failure explicitly.

```sh
npm install @shirudo/result
pnpm add @shirudo/result
yarn add @shirudo/result
```

```ts
import { Result, err, ok } from '@shirudo/result';

function divide(a: number, b: number): Result<number, string> {
    if (b === 0) return err('division by zero');
    return ok(a / b);
}

const result = divide(10, 2);

if (result.isOk()) {
    console.log(result.value);
} else {
    console.error(result.error);
}
```

## Why use it?

- Type-safe `Result<T, E>` values for success and failure.
- Pipeable operators for composable transformations.
- First-class async helpers for promises and async pipelines.
- Generator-based `task()` notation for sequential Result workflows.
- Fluent matching APIs for classes and discriminated unions.
- Explicit library error classes for unsafe unwrapping and API misuse.

Start with [Getting Started](/guide/getting-started), then use the [API Reference](/api/result) for details.
