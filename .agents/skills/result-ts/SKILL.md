---
name: result-ts
description: Integrate, use, and refactor toward the @shirudo/result library (Result<T, E> error handling for TypeScript). Use when introducing @shirudo/result into a project, converting try/catch or null checks to Result types, composing Result pipelines, or answering questions about the library's API, operators, task do-notation, or error matching.
version: 2.0.0
---

# `@shirudo/result` Skill

`@shirudo/result` models expected failures as values: functions return `Result<T, E>` (an `Ok<T>` or an `Err<E>`) instead of throwing. The compiler forces both states to be handled and narrows `value`/`error` access after `isOk()`/`isErr()` checks. Failures short-circuit through compositions (`.pipe(...)`, `.pipeAsync(...)`, `task`).

## Instructions

1. Consult the reference that matches the job:
   - `references/api-cheatsheet.md`: signatures and a compiling example for every public function, grouped by task. Read this before writing code that uses an API you have not verified in this project.
   - `references/refactoring-patterns.md`: before/after patterns for converting `try/catch`, null checks, early-return chains, and nested `await` code to `Result`.
   - `references/best-practices.md`: idioms and conventions (error modeling with `code` discriminants, where to unwrap, async composition, serialization across boundaries).
2. Respect the two calling conventions; confusing them is the most common generated-code bug:
   - Operators from `@shirudo/result/operators` are curried and go inside `.pipe(...)`: `map`, `flatMap`, `mapErr`, `filter`, `tap`, `match`, `tryMap`, and their `...Async` variants.
   - Utilities like `unwrapOr`, `mapOr`, `and`, `or`, `sequence` are data-first: the `Result` is the first argument, and they are called outside pipes.
3. When declaring an explicit error type on `fromPromise`, `tryAsync`, `fromThrowable`, `tryCatch`, `tryMap`, or their variants, always pass the error mapper. The compiler rejects the explicit type without it.
4. Model error unions with a literal `code` discriminant (`{ code: 'not-found'; id: string }`), matching the library's own `ResultError.code` convention. Give error classes a distinguishing readonly member so `matchError().when(...)` chains can narrow structurally.
5. Return `Result` for failures the caller must handle; keep throwing for programmer errors (broken invariants, assertions). Async functions return `Promise<Result<T, E>>`; there is no `AsyncResult` wrapper type.
6. Verify generated code compiles. In this repository, `pnpm docs:check` also compile-checks every snippet in this skill's references; treat compile errors against the current API as the source of truth over any prose.
