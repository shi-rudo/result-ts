# @shirudo/result

Robust, type-safe error handling for TypeScript.

`@shirudo/result` brings the Result pattern to TypeScript. It helps you model expected failures as values instead of hidden exceptions, so callers must handle success and failure explicitly.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Runtime](https://img.shields.io/badge/Runtime-Node%20%7C%20Browser-green)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Stable](https://img.shields.io/badge/Status-Stable-brightgreen.svg)

## Installation

```sh
npm install @shirudo/result
pnpm add @shirudo/result
yarn add @shirudo/result
```

## Quick Start

```ts
import { Result, err, ok } from '@shirudo/result';

function divide(a: number, b: number): Result<number, string> {
    if (b === 0) {
        return err('division by zero');
    }

    return ok(a / b);
}

const result = divide(10, 2);

if (result.isOk()) {
    console.log('Success:', result.value);
} else {
    console.error('Error:', result.error);
}
```

## Features

- Type-safe `Result<T, E>` values for success and failure.
- Pipeable operators via `.pipe()` and `.pipeAsync()`.
- First-class async helpers for promises and async transformations.
- Generator-based `task()` notation for sequential workflows.
- Fluent matching APIs for classes and discriminated unions.
- Exported library error classes with stable `ERR_*` codes.

## Documentation

The full documentation lives in `docs/` and is built with VitePress.

```sh
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Start here:

- [Getting Started](docs/guide/getting-started.md)
- [Pipelines](docs/guide/pipelines.md)
- [Pattern Matching](docs/guide/matching.md)
- [Result API](docs/api/result.md)
- [Error Classes](docs/api/errors.md)
- [Version 1 Migration](docs/migration/v1.md)

## Contributing

Use TypeScript and Vitest. Before opening a pull request, run:

```sh
pnpm typecheck
pnpm test:types
pnpm test run
pnpm docs:build
pnpm build
```

## License

MIT
