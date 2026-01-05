# @shirudo/result

**Robust, type-safe error handling for TypeScript.**

> ⚠️ **Beta Notice**: This library is currently in beta. The API may change before the stable release. Use with caution in production environments.

`@shirudo/result` brings the power of the Result pattern (Monad) to TypeScript. It helps you write safer, more predictable code by treating errors as values rather than exceptions. Stop guessing if a function will throw—let the type system guide you.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Runtime](https://img.shields.io/badge/Runtime-Node%20%7C%20Browser-green)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Beta](https://img.shields.io/badge/Status-Beta-orange.svg)

## 🌟 Key Features

- **Type-Safe:** generic `Result<T, E>` type discriminates between Success (`Ok`) and Failure (`Err`).
- **Pipeable Architecture:** Functional, tree-shakeable operators via `.pipe()` and `.pipeAsync()`.
- **Async Support:** First-class support for Promises and async transformations.
- **Do-Notation:** A `task` generator utility to write sequential code without callback hell (similar to Rust's `?` operator).
- **Rich Pattern Matching:** Fluent builders for exhaustive matching and error handling.
- **Comprehensive Utilities:** Helpers for collections, conversion from/to Promises, Nullables, and try/catch blocks.

---

## 📦 Installation

```bash
npm install @shirudo/result
# or
pnpm add @shirudo/result
# or
yarn add @shirudo/result
```

---

## 🚀 Quick Start

### Basic Usage

Instead of throwing errors, return a `Result`.

```ts
import { ok, err, Result } from "@shirudo/result";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

const result = divide(10, 2);

if (result.isOk()) {
  // TypeScript narrows 'result' to Ok<number>
  console.log("Success:", result.value); // 5
} else {
  // TypeScript narrows 'result' to Err<string>
  console.error("Error:", result.error);
}
```

### Functional Pipelines

Use `.pipe()` to chain operations. If an error occurs at any step, the chain short-circuits and returns the `Err`.

```ts
import { ok, map, filter, mapErr } from "@shirudo/result";

const processed = ok(10).pipe(
  map((n) => n * 2), // 20
  filter(
    (n) => n > 50,
    () => "Too small"
  ), // Returns Err('Too small')
  mapErr((e) => `Error: ${e}`) // Transforms the error message
);

console.log(processed.isErr()); // true
console.log(processed.unwrapOr(0)); // 0 (fallback)
```

---

## 💡 Core Concepts

### Creating Results

There are several static factories to help you wrap existing code or values.

```ts
import { Result } from "@shirudo/result";

// Standard
const a = Result.ok(42);
const b = Result.err("Something went wrong");

// From a function that might throw
const json = Result.try(() => JSON.parse('{"valid": true}'));

// From a potentially null/undefined value
const user = Result.fromNullable(maybeUser, "User not found");

// From a Promise (catches rejections)
const asyncRes = await Result.fromPromise(fetch("/api/data"));
```

### Async Pipelines

Transforming async results is seamless with `.pipeAsync()`.

```ts
import { ok, mapAsync, tryCatchAsync } from "@shirudo/result";

const result = await ok(1).pipeAsync(
  mapAsync(async (id) => {
    const user = await db.getUser(id);
    return user.name;
  }),
  tryCatchAsync(async (name) => {
    // If this throws, it becomes an Err
    return await externalService.validate(name);
  })
);
```

### Generator "Do-Notation" (`task`)

The `task` (or `gen`) utility allows you to write code that looks imperative but handles `Result` flow control automatically. Use `yield*` to unwrap `Ok` values; if an `Err` is yielded, the function returns early with that error.

```ts
import { task, ok, err } from "@shirudo/result";

const calculate = task(function* () {
  // yield* automatically unwraps the value if Ok
  const x = yield* ok(10);
  const y = yield* ok(20);

  // If this were err(), execution would stop here and return that err
  const z = yield* validate(x + y);

  return z; // Returns Ok(z)
});

// calculate is a Promise<Result<number, Error>>
```

### Folding Results

The simplest way to handle both `Ok` and `Err` cases and return a single value:

```ts
import { ok, err } from "@shirudo/result";

const result = ok(42);

const message = result.fold(
  (val) => `Success: ${val}`,
  (err) => `Error: ${err}`
);
// message = "Success: 42"

// Useful for side effects
result.fold(
  (val) => console.log("Yay:", val),
  (err) => console.error("Nay:", err)
);

// Convert to HTTP response
const response = result.fold(
  (data) => ({ status: 200, body: data }),
  (error) => ({ status: 500, body: { error } })
);
```

### Pattern Matching

Handle errors exhaustively using the fluent matching API for complex error types.

```ts
import { Result } from "@shirudo/result";

class NetworkError extends Error {}
class ValidationError extends Error {}

const result = Result.err(new NetworkError("Timeout"));

const message = result
  .match()
  .err(NetworkError, (e) => `Retry later: ${e.message}`)
  .err(ValidationError, (e) => `Invalid input: ${e.message}`)
  .ok((val) => `Success: ${val}`)
  .run();
```

**When to use what:**

- Use `.fold()` for simple cases where you handle both Ok and Err
- Use `.match()` for complex pattern matching on multiple error types
- Use `fold()` pipe operator for functional composition in pipelines

---

## 📚 API Reference

### Creation & Conversions

- `ok(value)` / `err(error)`: Create basic instances.
- `Result.try(fn)`: Execute a sync function; catches exceptions as `Err`.
- `Result.fromNullable(val, fallback)`: Convert `null | undefined` to `Err`.
- `Result.fromPromise(promise)`: Convert a Promise to `Promise<Result>`.
- `.toPromise()`: Convert `Ok` to resolved Promise, `Err` to rejected.
- `.toNullable()`: Convert `Ok` to value, `Err` to `null`.

### Instance Methods

- `.isOk()`: Type guard for success.
- `.isErr()`: Type guard for failure.
- `.unwrap()`: Get value or throw (use carefully).
- `.unwrapOr(default)`: Get value or return default.
- `.unwrapOrElse(fn)`: Get value or generate default from error.
- `.expect(msg)`: Get value or throw with specific message.
- `.fold(onOk, onErr)`: Handle both cases and return a single value.
- `.pipe(...)`: Chain operators synchronously.
- `.pipeAsync(...)`: Chain operators asynchronously.

### Pipeable Operators

Import these from the root package to use inside `.pipe()`.

| Operator               | Description                                              |
| :--------------------- | :------------------------------------------------------- |
| `map(fn)`              | Transform the `Ok` value.                                |
| `mapErr(fn)`           | Transform the `Err` value.                               |
| `mapBoth(fnOk, fnErr)` | Transform both sides.                                    |
| `flatMap(fn)`          | Chain a function that returns a `Result` (monadic bind). |
| `filter(pred, errFn)`  | Turn `Ok` into `Err` if predicate fails.                 |
| `tap(observer)`        | Run side effects (logging) without changing the result.  |
| `recover(val)`         | Convert `Err` to `Ok` with a default value.              |
| `tryCatch(fn)`         | Run a function, catching exceptions into `Err`.          |
| `tryMap(fn)`           | Like `map`, but catches exceptions.                      |
| `fold({ ok, err })`    | Terminate the pipe and return a value based on state.    |

**Async Variants:** `mapAsync`, `mapErrAsync`, `flatMapAsync`, `filterAsync`, `tapAsync`, `tryCatchAsync`, `tryMapAsync`, `foldAsync`.

### Collections

- `sequence(results)`: Turn `Result[]` into `Result<T[]>`. First error stops the process.
- `collectFirstOk(results)`: Find the first success, or return all errors.
- `partition(results)`: Separate a list into arrays of `[oks, errs]`.
- `zip(r1, r2)`: Combine two results into a tuple.

---

## 🤝 Contributing

We welcome contributions! Please follow the standard pull request process. Ensure usage of TypeScript and Vitest for testing.

## 📄 License

This project is licensed under the MIT License.
