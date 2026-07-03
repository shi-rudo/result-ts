# Examples

These examples show how to use the Result library in practical scenarios.

## Run

The examples are fully typed and can be compiled with TypeScript:

```bash
# Type-Check
pnpm tsc --noEmit src/examples/simple-example.ts

# Or with tsx (if installed)
pnpm tsx src/examples/simple-example.ts
```

## Available Examples

### `simple-example.ts`

Basic Result pattern usage:

- Validation functions returning `Result<T, E>`
- Result propagation through functions
- Type guards (`isOk`/`isErr`) for consumption
- Early error returns

**Key concepts:**

- Idiomatic Result creation
- Type-safe error propagation
- Result consumption patterns

### `explicit-checks.ts`

Explicit control flow pattern with type guards:

- Go-like explicit checks + early returns
- Using `isOk()` and `isErr()` utilities
- Switching on discriminated union errors
- Mixed usage of standalone functions and `Result.*` static methods

**Key concepts:**

- Explicit error handling with early returns
- Type narrowing with guards
- Domain error patterns

### `fold-example.ts`

The `fold()` method for handling both cases:

- Simple fold with string output
- Fold for side effects (logging)
- Convert to HTTP responses
- Fold with complex types
- Fold method vs fold pipe operator

**Key concepts:**

- Single-value returns from Results
- Exhaustive error handling
- Functional composition with fold

### `recover.ts`

Error recovery with fallback values:

- **recover**: simple fallback value on errors
- **recoverWith**: error-based fallback logic
- Error logging with recovery
- Chaining with other operators
- Different types for fallback values

**Key concepts:**

- Convert errors into successful values
- Error type becomes `never` (guaranteed no error left)
- Flexible fallback type (can differ from original type)

### `static-factories.ts`

Static factory methods and conversions:

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

### `result-comprehensive.ts`

Comprehensive examples covering all major features:

1. **BASICS**: create Result, `okIf`, `okIfLazy`
2. **TRANSFORMATIONS**: `map`, `mapErr`, `flatMap`
3. **VALIDATION**: `filter`, `tryMap`
4. **ERROR HANDLING**: `recover`, `recoverWith`, `tryCatch`
5. **SIDE EFFECTS**: `tap`
6. **ASYNC OPERATIONS**: `fromPromise`, `mapAsync`, `flatMapAsync`, `tryCatchAsync`
7. **COLLECTIONS**: `sequence`, `zip`, `collectFirstOk`
8. **CONVERSIONS**: `fromNullable`, `toPromise`
9. **DO-NOTATION**: generator-based syntax with `task()`
10. **PATTERN MATCHING**: universal matching
11. **REAL-WORLD EXAMPLE**: User API service
12. **CHAINING & COMPOSITION**: complex pipelines
13. **BEST PRACTICES**: do's and don'ts

**Key concepts:**

- All core patterns in one file
- Real-world API service implementation
- Best practices guide
