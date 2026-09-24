# Coming from Other Libraries

Each concept has one name here, and the library keeps no aliases. Find the name that you know in the table.

| Concept | `@shirudo/result` | neverthrow | fp-ts `Either` | Rust |
| :------ | :---------------- | :--------- | :------------- | :--- |
| Create | `ok` / `err` | `ok` / `err` | `right` / `left` | `Ok` / `Err` |
| Map the value | `map` | `map` | `map` | `map` |
| Map the error | `mapErr` | `mapErr` | `mapLeft` | `map_err` |
| Map both | `mapBoth` | none | `bimap` | none |
| Chain a Result | `flatMap` | `andThen` | `flatMap` / `chain` | `and_then` |
| Fall back to a Result | `orElse` | `orElse` | `orElse` | `or_else` |
| Fall back to a value | `recover` / `recoverElse` | none | none | none |
| Handle both branches | `fold` | `match` | `match` / `fold` | `match`, `map_or_else` |
| Default value | `unwrapOr` / `unwrapOrElse` | `unwrapOr` | `getOrElse` | `unwrap_or` / `unwrap_or_else` |
| Side effect | `tap` | `andTee` / `orTee` | `tap` / `chainFirst` | `inspect` / `inspect_err` |
| List, first error | `sequence` | `Result.combine` | `sequenceArray` | `collect::<Result<Vec<_>, _>>()` |
| List, all errors | `collectAllErrors` | `Result.combineWithAllErrors` | `getApplicativeValidation` | none |
| Catch a throw | `tryFn` / `Result.try`, `fromThrowable` | `fromThrowable` | `tryCatch` | none |
| Wrap a promise | `fromPromise` | `fromPromise` / `ResultAsync` | `TaskEither.tryCatch` | none |
| Do-notation | `task` with `yield*` | `safeTry` | `Do` / `bind` | the `?` operator |
| Swap the states | `swap` | none | `swap` | none |
| From a nullable value | `fromNullable` | none | `fromNullable` | `Option::ok_or` |
| Assert `Ok` | `.expect()` / `expectOk` | `_unsafeUnwrap` | none | `expect` |
