# Best Practices for `result-ts`

This guide provides best practices for using the `result-ts` library to write robust and maintainable code.

## 1. Use `Result` for Synchronous Operations, `AsyncResult` for Asynchronous

-   **`Result`**: Use for synchronous functions that can fail. This makes error handling explicit and part of the function's signature.
-   **`AsyncResult` (from `result-ts`'s async features)**: Use for asynchronous operations, like Promises, that can fail. It provides a similar API to `Result` but for async workflows. `result-ts` has `mapAsync`, `flatMapAsync` etc to work with promises.

## 2. Handle Errors Gracefully at the End of the Chain

Instead of checking for errors at every step, chain your operations using `map` and `flatMap` and handle the error at the very end. This is often called the "happy path" approach.

### Bad

```typescript
function process(): void {
  const result1 = operation1();
  if (isErr(result1)) {
    // handle error
    return;
  }

  const result2 = operation2(result1.value);
  if (isErr(result2)) {
    // handle error
    return;
  }
  // ...
}
```

### Good

```typescript
function process(): void {
  operation1()
    .pipe(flatMap(operation2))
    .pipe(flatMap(operation3))
    .pipe(
      match({
        ok: (value) => console.log('Success:', value),
        err: (error) => console.error('Error:', error),
      })
    );
}
```

## 3. Avoid Unwrapping Too Early

The `unwrap` family of functions (`unwrapOr`, `unwrapOrElse`, `unwrapOrThrow`) should be used at the "edges" of your application, where you need to get a concrete value out of the `Result`. Avoid using them in the middle of your business logic, as it undermines the safety that `Result` provides.

### Bad

```typescript
function getUsername(id: number): string {
  const userResult = findUser(id);
  // Unwrapping in the middle of logic
  const user = userResult.pipe(unwrapOrThrow());
  return user.name;
}
```

### Good

```typescript
function getUsername(id: number): Result<string, string> {
  return findUser(id).pipe(map((user) => user.name));
}

// At the edge of the application (e.g., in a UI component or controller)
const username = getUsername(1).pipe(unwrapOr('Guest'));
```

## 4. Use the Pipeable API for Readability

`result-ts` provides a pipeable API, which allows you to chain operations in a readable and type-safe way. Prefer this over nested function calls.

### Bad

```typescript
const result = map(flatMap(ok(5), (n) => ok(n + 1)), (n) => n * 2);
```

### Good

```typescript
const result = ok(5)
  .pipe(flatMap((n) => ok(n + 1)))
  .pipe(map((n) => n * 2));
```

## 5. Keep Error Types Consistent

When possible, use a consistent type for your errors within a given domain of your application. This makes error handling more predictable. You can use a union of string literals, an enum, or a custom error class.

### Example with Union Type

```typescript
type FileError = 'FileNotFound' | 'PermissionDenied' | 'UnknownError';

function readFile(path: string): Result<string, FileError> {
  // ...
}
```
This allows you to handle errors exhaustively with a `match` or `switch` statement.
