# Getting Started

## Installation

```sh
npm install @shirudo/result
pnpm add @shirudo/result
yarn add @shirudo/result
```

## Basic Usage

Return `Result<T, E>` from functions that can fail in expected ways.

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

## Creating Results

```ts
import { Result } from '@shirudo/result';

const value = Result.ok(42);
const failure = Result.err('something went wrong');

const parsed = Result.try(() => JSON.parse('{"valid": true}'));
const safeParse = Result.fromThrowable(
    JSON.parse,
    error => ({ type: 'parse', cause: error }),
);
const user = Result.fromNullable(maybeUser, 'user not found');
const response = await Result.fromPromise(
    fetch('/api/data'),
    error => ({ type: 'network', cause: error }),
);
```

## Choosing Error Types

Use typed domain errors for expected failures:

```ts
type UserError =
    | { type: 'not-found'; id: string }
    | { type: 'inactive'; id: string };
```

Use exceptions only for programmer mistakes, unsafe unwraps, invalid state, or boundaries where throwing APIs are required. The library's exported error classes are documented in [Error Classes](/api/errors).
