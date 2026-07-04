# Refactoring Patterns for `@shirudo/result`

Patterns for converting existing TypeScript code to `Result`. Every snippet in this file is compile-checked in CI (`pnpm docs:check`).

## 1. Replacing `try...catch` Blocks

For a one-off call, use `tryFn` (alias `Result.try`). To create a reusable safe wrapper around a throwing function, use `fromThrowable`. Pass an error mapper to get a typed error instead of `unknown`.

### Before

```typescript
function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return { error: 'Failed to parse JSON' };
  }
}
```

### After

```typescript
import { fromThrowable, tryFn, type Result } from '@shirudo/result';

type ParseError = { code: 'parse'; cause: unknown };

// Reusable wrapper:
const parseJson = fromThrowable(
  JSON.parse,
  (cause): ParseError => ({ code: 'parse', cause }),
);
const parsed: Result<any, ParseError> = parseJson('{"a":1}');

// One-off call (error stays unknown without a mapper):
const oneOff = tryFn(() => JSON.parse('{"a":1}'));
```

Note: `tryCatch` also exists, but it is a curried **pipe operator** that runs only when the incoming Result is `Ok`. It is not the tool for converting a plain throwing call.

## 2. Replacing `null`/`undefined` Checks

Use `fromNullable` to convert nullable values into a `Result`.

### Before

```typescript
type User = { id: number; name: string };
declare function fetchUser(id: number): User | undefined;

function greet(id: number): string | null {
  const user = fetchUser(id);
  if (user === undefined) return null;
  return `Hello, ${user.name}`;
}
```

### After

```typescript
import { fromNullable, type Result } from '@shirudo/result';
import { map } from '@shirudo/result/operators';

type User = { id: number; name: string };
declare function fetchUser(id: number): User | undefined;

function getUser(id: number): Result<User, { code: 'not-found'; id: number }> {
  return fromNullable(fetchUser(id), { code: 'not-found', id });
}

const greeting = getUser(1).pipe(map(user => `Hello, ${user.name}`));
```

## 3. Replacing Early-Return Checks with a Chain

Chain fallible steps with `flatMap` inside one `.pipe(...)` call, then leave the pipe with `match` (or call `unwrapOr(result, fallback)` afterwards; `unwrapOr` is data-first and does not belong inside the pipe).

### Before

```typescript
type Data = { raw: string };
declare function step1(data: Data): { value?: string; error?: string };
declare function step2(value: string): { value?: string; error?: string };

function processData(data: Data): string {
  const result1 = step1(data);
  if (result1.error || result1.value === undefined) return 'default';
  const result2 = step2(result1.value);
  if (result2.error || result2.value === undefined) return 'default';
  return result2.value;
}
```

### After

```typescript
import { unwrapOr, type Result } from '@shirudo/result';
import { flatMap } from '@shirudo/result/operators';

type Data = { raw: string };
declare function step1(data: Data): Result<string, { code: 'step1' }>;
declare function step2(value: string): Result<string, { code: 'step2' }>;

function processData(data: Data): string {
  const result = step1(data).pipe(flatMap(step2));
  return unwrapOr(result, 'default');
}
```

## 4. Centralizing Error Handling

Normalize errors with `mapErr` along the way and resolve both branches once at the end with `match`.

### Before

```typescript
class SpecificError extends Error {}
declare function mightFail(): string;

function doSomething(): string {
  try {
    const value = mightFail();
    return `Success: ${value}`;
  } catch (e) {
    if (e instanceof SpecificError) return 'Handled specific error';
    return 'Generic error';
  }
}
```

### After

```typescript
import { tryFn } from '@shirudo/result';
import { map, mapErr, match } from '@shirudo/result/operators';

class SpecificError extends Error {}
declare function mightFail(): string;

function doSomething(): string {
  return tryFn(mightFail).pipe(
    map(value => `Success: ${value}`),
    mapErr(e => (e instanceof SpecificError ? 'Handled specific error' : 'Generic error')),
    match({
      ok: value => value,
      err: error => error,
    }),
  );
}
```

## 5. Replacing Nested `await` + `try/catch` with `task`

Sequential async flows with intermediate variables convert naturally to generator do-notation.

### Before

```typescript
declare function loadUser(id: string): Promise<{ email?: string }>;
declare function send(email: string): Promise<void>;

async function notify(id: string): Promise<'sent' | 'failed'> {
  try {
    const user = await loadUser(id);
    if (!user.email) return 'failed';
    await send(user.email);
    return 'sent';
  } catch {
    return 'failed';
  }
}
```

### After

```typescript
import { err, fromPromise, task } from '@shirudo/result';

declare function loadUser(id: string): Promise<{ email?: string }>;
declare function send(email: string): Promise<void>;

async function notify(id: string): Promise<'sent' | 'failed'> {
  const result = await task(
    async function* () {
      const user = yield* await fromPromise(loadUser(id), cause => ({ code: 'load' as const, cause }));
      if (!user.email) return yield* err({ code: 'no-email' as const });
      yield* await fromPromise(send(user.email), cause => ({ code: 'send' as const, cause }));
      return 'sent' as const;
    },
  );

  return result.isOk() ? result.value : 'failed';
}
```
