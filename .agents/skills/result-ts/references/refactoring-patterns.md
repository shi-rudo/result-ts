# Refactoring Patterns for `@shirudo/result`

This guide provides patterns for refactoring existing TypeScript code to use the `@shirudo/result` library.

## 1. Replacing `try...catch` blocks

Instead of using `try...catch` to handle exceptions, you can use `tryCatch` to wrap functions that might throw errors.

### Before

```typescript
function parseJson(json: string): any {
  try {
    return JSON.parse(json);
  } catch (e) {
    return { error: 'Failed to parse JSON' };
  }
}
```

### After

```typescript
import { tryCatch, Result } from '@shirudo/result';

function parseJson(json: string): Result<any, string> {
  return tryCatch(
    () => JSON.parse(json),
    (e) => 'Failed to parse JSON'
  );
}
```

## 2. Handling `null` or `undefined`

Use `fromNullable` to convert `null` or `undefined` values into an `Err` result.

### Before

```typescript
function getUser(id: number): User | null {
  // ... logic to fetch user
}

const user = getUser(1);
if (user === null) {
  // handle error
} else {
  // use user
}
```

### After

```typescript
import { fromNullable, Result } from '@shirudo/result';

function getUser(id: number): Result<User, 'User not found'> {
  const user = // ... logic to fetch user
  return fromNullable(user, 'User not found');
}

const userResult = getUser(1);
userResult.pipe(
  map((user) => {
    // use user
  })
);
```

## 3. Chaining Operations

Instead of nested `if` statements, use `flatMap` to chain operations that can fail.

### Before

```typescript
function processData(data: Data): string {
  const result1 = operation1(data);
  if (result1.error) {
    return 'default';
  }
  const result2 = operation2(result1.value);
  if (result2.error) {
    return 'default';
  }
  return result2.value;
}
```

### After

```typescript
import { Result, flatMap, map, unwrapOr } from '@shirudo/result';

function processData(data: Data): string {
  return operation1(data).pipe(
    flatMap(operation2),
    unwrapOr('default')
  );
}

function operation1(data: Data): Result<string, string> {
  // ...
}

function operation2(value: string): Result<string, string> {
  // ...
}
```

## 4. Centralized Error Handling

Use `mapErr` to transform errors and `orElse` or `recover` to handle them at the end of a chain.

### Before

```typescript
function doSomething(): string {
  try {
    const value = mightFail();
    return `Success: ${value}`;
  } catch (e) {
    if (e instanceof SpecificError) {
      return 'Handled specific error';
    }
    return 'Generic error';
  }
}
```

### After

```typescript
import { Result, tryCatch, map, mapErr, fold } from '@shirudo/result';

function doSomething(): string {
  return tryCatch(mightFail).pipe(
    map((value) => `Success: ${value}`),
    mapErr((e) => {
      if (e instanceof SpecificError) {
        return 'Handled specific error';
      }
      return 'Generic error';
    }),
    fold(
      (value) => value,
      (error) => error
    )
  );
}
```
