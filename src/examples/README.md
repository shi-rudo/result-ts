# Examples

These examples show how to use the Result library in practical scenarios.

## Run

The examples are fully typed and can be compiled with TypeScript:

```bash
# Type-Check
pnpm tsc --noEmit src/examples/recover.ts

# Or with tsx (if installed)
pnpm tsx src/examples/recover.ts
```

## Available Examples

### `static-factories.ts`

Shows how to use static factory methods to create Results:

- **Result.try()**: catch exceptions
- **Result.fromNullable()**: convert nullable values
- **Result.fromPromise()**: async operations with error handling
- Combine with pipe operators
- Real-world form validation example
- Comparison: static methods vs. standalone functions

**Key concepts:**

- Idiomatic Result creation
- Type-safe conversions
- Integration with the pipe system

### `recover.ts`

Shows the use of `recover` and `recoverWith` for error handling with fallback values:

- **recover**: simple fallback value on errors
- **recoverWith**: error-based fallback logic
- Error logging with recovery
- Chaining with other operators
- Different types for fallback values

**Key concepts:**

- Convert errors into successful values
- Error type becomes `never` (guaranteed no error left)
- Flexible fallback type (can differ from original type)
