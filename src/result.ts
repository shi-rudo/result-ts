import { Pipeable } from './pipeable';
import { ErrMatchBuilder, ErrorMatchBuilder, ResultMatchBuilder } from './matcher';
import { fromNullable as fromNullableFn } from './conversions/fromNullable';
import { fromPromise as fromPromiseFn } from './conversions/fromPromise';
import { tryFn } from './conversions/try';
import { toPromise as toPromiseFn } from './conversions/toPromise';
import { toNullable as toNullableFn } from './conversions/toNullable';

// --- 1. Helper Types ---

// An operator is a function that takes a Result and returns something else.
export type OperatorFunction<T, E, R> = (input: Result<T, E>) => R;
export type { Awaitable } from './pipeable';
export type AsyncOperatorFunction<T, E, R> = (input: Result<T, E>) => Promise<R>;

// --- 2. The Result Class ---

export type Ok<T> = { readonly _tag: 'Ok'; readonly value: T };
export type Err<E> = { readonly _tag: 'Err'; readonly error: E };
export type ResultType<T, E> = Ok<T> | Err<E>;

export class Result<T, E> extends Pipeable {
    readonly #state: ResultType<T, E>;

    private constructor(state: ResultType<T, E>) {
        super();
        Object.freeze(state);
        this.#state = state;
        Object.freeze(this);
    }

    /**
     * Creates an Ok Result with the given value.
     * 
     * **Note**: `null` and `undefined` are allowed as values.
     * If you want to convert `null`/`undefined` to an Err, use `fromNullable()`.
     * 
     * @param value The value for the Ok Result
     * @returns An Ok Result with the given value
     * 
     * @example
     * ```ts
     * const result = Result.ok(42);
     * const nullResult = Result.ok(null); // Allowed!
     * ```
     */
    static ok<T, E = never>(value: T): Result<T, E> {
        return new Result<T, E>({ _tag: 'Ok', value });
    }

    /**
     * Creates an Err Result with the given error.
     * 
     * **Note**: `null` and `undefined` are allowed as errors.
     * 
     * @param error The error for the Err Result
     * @returns An Err Result with the given error
     * 
     * @example
     * ```ts
     * const result = Result.err('error message');
     * const nullError = Result.err(null); // Allowed!
     * ```
     */
    static err<E, T = never>(error: E): Result<T, E> {
        return new Result<T, E>({ _tag: 'Err', error });
    }

    /**
     * Converts `null | undefined` to `Err`, everything else to `Ok`.
     * 
     * **Type Safety**: The type assertion `as NonNullable<T>` is safe,
     * as the runtime check guarantees that the value is not null/undefined.
     * 
     * @param value The value to check
     * @param error The error to use if value is null/undefined
     * @returns An Ok Result with the NonNullable value, or an Err Result with the error
     * 
     * @example
     * ```ts
     * Result.fromNullable(user, 'User not found')
     * // Ok(user) or Err('User not found')
     * ```
     */
    static fromNullable<T, E>(value: T, error: E): Result<NonNullable<T>, E> {
        return fromNullableFn(value, error);
    }

    /**
     * Converts a Promise to a Result-Promise.
     * Exceptions are converted to Err.
     * 
     * This static method delegates to the standalone `fromPromise()` function.
     * 
     * @example
     * ```ts
     * const result = await Result.fromPromise(fetch('/api/user'));
     * // Ok(response) or Err(error)
     * 
     * // With custom error mapper
     * const result = await Result.fromPromise(
     *     fetch('/api/user'),
     *     (e) => `Network error: ${e}`
     * );
     * ```
     */
    static fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
    static fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>>;
    static fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
        return fromPromiseFn(promise, errorMapper);
    }

    /**
     * Executes a function and catches exceptions.
     * 
     * @example
     * ```ts
     * const result = Result.try(() => JSON.parse(input));
     * // Ok(parsed) or Err(SyntaxError)
     * ```
     */
    static try<T>(fn: () => T): Result<T, unknown> {
        return tryFn(fn);
    }

    // Basic helpers for internal access in operators
    /**
     * Checks if the Result is Ok.
     * 
     * @returns `true` if the Result is Ok (and narrows the type)
     * 
     * @example
     * ```ts
     * if (result.isOk()) {
     *   const value: T = result.value; // TypeScript knows that value is defined
     * }
     * ```
     */
    isOk(): this is Result<T, E> & { readonly value: T; readonly error: undefined } {
        return this.#state._tag === 'Ok';
    }

    /**
     * Checks if the Result is Err.
     * 
     * @returns `true` if the Result is Err (and narrows the type)
     * 
     * @example
     * ```ts
     * if (result.isErr()) {
     *   const error: E = result.error; // TypeScript knows that error is defined
     * }
     * ```
     */
    isErr(): this is Result<T, E> & { readonly value: undefined; readonly error: E } {
        return this.#state._tag === 'Err';
    }

    get value(): T | undefined {
        return this.#state._tag === 'Ok' ? this.#state.value : undefined;
    }

    get error(): E | undefined {
        return this.#state._tag === 'Err' ? this.#state.error : undefined;
    }

    /**
     * Returns the value, guaranteed to be defined after `isOk()` check.
     * This method provides better type narrowing than the `value` getter.
     * 
     * ⚠️ **Warning**: This method throws an Error if called on an Err result.
     * Use this method only after a type guard (`if (result.isOk())`).
     * For a safer alternative with a custom message, use `expect()`.
     * 
     * @throws {Error} If called on an Err result
     * 
     * @example
     * ```ts
     * if (result.isOk()) {
     *   const value = result.unwrap(); // Type is T, not T | undefined
     * }
     * ```
     */
    unwrap(): T {
        if (this.#state._tag === 'Ok') {
            return this.#state.value;
        }
        // Safe string conversion for error messages
        const errorStr = (() => {
            try {
                const error = this.#state.error;
                if (error === null) return 'null';
                if (error === undefined) return 'undefined';
                if (typeof error === 'string') return error;
                if (error instanceof Error) return error.message;
                if (typeof error === 'object' && 'toString' in error) {
                    try {
                        return String(error);
                    } catch {
                        return '[unstringifiable error]';
                    }
                }
                return String(error);
            } catch {
                return '[unstringifiable error]';
            }
        })();
        throw new Error(`Called unwrap() on Err: ${errorStr}`);
    }

    /**
     * Returns the error, guaranteed to be defined after `isErr()` check.
     * This method provides better type narrowing than the `error` getter.
     * 
     * ⚠️ **Warning**: This method throws an Error if called on an Ok result.
     * Use this method only after a type guard (`if (result.isErr())`).
     * For a safer alternative with a custom message, use `expectErr()`.
     * 
     * @throws {Error} If called on an Ok result
     * 
     * @example
     * ```ts
     * if (result.isErr()) {
     *   const error = result.unwrapErr(); // Type is E, not E | undefined
     * }
     * ```
     */
    unwrapErr(): E {
        if (this.#state._tag === 'Err') {
            return this.#state.error;
        }
        // Safe string conversion for error messages
        const valueStr = (() => {
            try {
                const value = this.#state.value;
                if (value === null) return 'null';
                if (value === undefined) return 'undefined';
                if (typeof value === 'string') return value;
                if (value instanceof Error) return value.message;
                if (typeof value === 'object' && 'toString' in value) {
                    try {
                        return String(value);
                    } catch {
                        return '[unstringifiable value]';
                    }
                }
                return String(value);
            } catch {
                return '[unstringifiable value]';
            }
        })();
        throw new Error(`Called unwrapErr() on Ok: ${valueStr}`);
    }

    /**
     * Returns the value with a custom error message if the result is Err.
     * Similar to `unwrap()`, but allows you to provide a custom error message.
     * 
     * ⚠️ **Warning**: This method throws an Error if called on an Err result.
     * Use this method only if you are sure the Result is Ok,
     * or if you need a meaningful error message.
     * 
     * @param message Custom error message to throw if result is Err
     * @returns The value if result is Ok
     * @throws {Error} If called on an Err result with the provided message
     * 
     * @example
     * ```ts
     * const result = fetchUser(id);
     * const user = result.expect('User should exist'); // Throws with custom message if Err
     * ```
     */
    expect(message: string): T {
        if (this.#state._tag === 'Ok') {
            return this.#state.value;
        }
        throw new Error(message);
    }

    /**
     * Returns the error with a custom error message if the result is Ok.
     * Similar to `unwrapErr()`, but allows you to provide a custom error message.
     * 
     * ⚠️ **Warning**: This method throws an Error if called on an Ok result.
     * Use this method only if you are sure the Result is Err,
     * or if you need a meaningful error message.
     * 
     * @param message Custom error message to throw if result is Ok
     * @returns The error if result is Err
     * @throws {Error} If called on an Ok result with the provided message
     * 
     * @example
     * ```ts
     * const result = validateInput(input);
     * if (result.isErr()) {
     *   const error = result.expectErr('Validation should have failed'); // Throws if Ok
     * }
     * ```
     */
    expectErr(message: string): E {
        if (this.#state._tag === 'Err') {
            return this.#state.error;
        }
        throw new Error(message);
    }

    unwrapOr<D = T>(defaultValue: D): T | D {
        return this.#state._tag === 'Ok' ? this.#state.value : defaultValue;
    }

    /**
     * Converts the Result to a Promise.
     * Ok → resolves with the value, Err → rejects with the error
     * 
     * This instance method delegates to the standalone `toPromise()` function.
     * 
     * @returns A Promise that resolves with the value if Ok, or rejects with the error if Err
     * 
     * @example
     * ```ts
     * const result = ok(42);
     * const promise = result.toPromise();
     * const value = await promise; // 42
     * 
     * const errResult = err('error');
     * try {
     *   await errResult.toPromise();
     * } catch (error) {
     *   console.log(error); // 'error'
     * }
     * ```
     */
    toPromise(): Promise<T> {
        return toPromiseFn(this);
    }

    /**
     * Converts the Result to `T | null`.
     * Ok → returns the value, Err → returns null
     * 
     * This instance method delegates to the standalone `toNullable()` function.
     * 
     * @returns The value if Ok, or null if Err
     * 
     * @example
     * ```ts
     * const result = ok(42);
     * const value = result.toNullable(); // 42
     * 
     * const errResult = err('error');
     * const nullValue = errResult.toNullable(); // null
     * ```
     */
    toNullable(): T | null {
        return toNullableFn(this);
    }

    /**
     * Enables `yield* result` in generators (Do-notation).
     *
     * The iterator yields the `Result` itself; the runner (see `task`) decides:
     * - Ok  → sends back the Ok value (`next(value)`), `yield*` yields `T`
     * - Err → aborts and returns the Err Result
     */
    *[Symbol.iterator](): Generator<Result<T, E>, T, unknown> {
        return (yield this) as T;
    }

    /**
     * Universal pattern matcher for Ok + Err cases.
     * 
     * Use this to exhaustively match on both success and error cases with type-based
     * and value-based pattern matching.
     * 
     * @example
     * ```ts
     * const message = result
     *   .match()
     *   .err(NetworkError, e => `Network: ${e.message}`)
     *   .err(ValidationError, e => `Validation: ${e.message}`)
     *   .ok(val => `Success: ${val}`)
     *   .run();
     * ```
     */
    match(): ResultMatchBuilder<T, E, never> {
        return ResultMatchBuilder.fromResult(this);
    }

    /**
     * Matches on the Err value via `.when(...)` chain.
     *
     * Note: For type safety reasons, `.matchErr()` can only be called on a Result that has already been narrowed to `Err`,
     * e.g., inside `if (result.isErr()) { ... }`.
     * 
     * @example
     * ```ts
     * if (result.isErr()) {
     *   const message = result
     *     .matchErr()
     *     .when(IOError, () => 'IO error')
     *     .when(ParseError, () => 'Parse error')
     *     .otherwise(e => `Other: ${e}`);
     * }
     * ```
     */
    matchErr(this: Result<T, E> & { readonly error: E }): ErrorMatchBuilder<E, never>;
    matchErr(this: Result<T, E>): never;
    matchErr(): unknown {
        if (this.isErr()) return new ErrorMatchBuilder(this.error);
        throw new Error('matchErr() can only be called on Err results. Use `if (result.isErr()) { ... }` first.');
    }

    /**
     * Matches on the Err value, but normalizes every branch to a `Result`:
     * - Handlers may return a `Result` (returned directly)
     * - or an error value (wrapped to `Err(error)`)
     */
    matchErrResult(): ErrMatchBuilder<T, E, never, never> {
        const makeErr = <Err>(error: Err) => Result.err<Err, never>(error);
        return ErrMatchBuilder.fromResult(this, makeErr);
    }

    /**
     * @deprecated Use `.match()` instead. Will be removed in next major version.
     */
    pattern(): ResultMatchBuilder<T, E, never> {
        return this.match();
    }

    /**
     * @deprecated Use `.match()` instead. Will be removed in next major version.
     */
    switch(): ResultMatchBuilder<T, E, never> {
        return this.match();
    }

    /**
     * Folds the Result into a single value by applying one of two functions.
     * 
     * This is a direct method equivalent to the `match` pipe operator.
     * Use this when you want to handle both Ok and Err cases and return a single value.
     * 
     * @param onOk Function to apply if the Result is Ok
     * @param onErr Function to apply if the Result is Err
     * @returns The result of applying the appropriate function
     * 
     * @example
     * ```ts
     * const result = ok(42);
     * const message = result.fold(
     *     val => `Success: ${val}`,
     *     err => `Error: ${err}`
     * );
     * // message = "Success: 42"
     * ```
     */
    fold<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
        if (this.isOk()) {
            return onOk(this.value);
        }
        if (this.isErr()) {
            return onErr(this.error);
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    /**
     * Returns the Result as a discriminated union (`{ _tag: 'Ok', value } | { _tag: 'Err', error }`).
     * Useful for libraries like `ts-pattern` that match on plain object unions.
     */
    toUnion(): ResultType<T, E> {
        return this.#state;
    }

    /**
     * Serializes the Result into a simple object format.
     * Preserves the original types.
     */
    serialize(): { isSuccess: boolean; data?: T; error?: E } {
        if (this.#state._tag === 'Ok') return { isSuccess: true, data: this.#state.value };
        return { isSuccess: false, error: this.#state.error };
    }

    /**
     * Serializes the Result into a user-friendly format.
     * Converts errors to readable strings.
     */
    toUserFriendly(): { isSuccess: boolean; data?: T; error?: string } {
        if (this.#state._tag === 'Ok') return { isSuccess: true, data: this.#state.value };

        const error = this.#state.error;
        const toSafeString = (value: unknown): string => {
            try {
                return String(value);
            } catch {
                return '[Unstringifiable error]';
            }
        };
        const errorMessage = (() => {
            if (error && typeof error === 'object' && 'message' in error) {
                const message = (error as { message?: unknown }).message;
                return typeof message === 'string' ? message : toSafeString(error);
            }
            return toSafeString(error);
        })();

        return { isSuccess: false, error: errorMessage };
    }

}

// Helper constructors
export const ok = Result.ok;
export const err = Result.err;

/**
 * Helper for conditional Result creation.
 * Avoids type inference issues with ternary operators.
 * 
 * @example
 * ```ts
 * const result = okIf(value > 5, value, 'too small');
 * // instead of: value > 5 ? ok(value) : err('too small')
 * ```
 */
export function okIf<T, E>(
    condition: boolean,
    okValue: T,
    errValue: E
): Result<T, E> {
    return condition ? ok(okValue) : err(errValue);
}

/**
 * Helper for conditional Result creation with lazy evaluation.
 * Evaluates values only when they are needed.
 * 
 * @example
 * ```ts
 * const result = okIfLazy(
 *     value > 5,
 *     () => expensiveComputation(value),
 *     () => 'too small'
 * );
 * ```
 */
export function okIfLazy<T, E>(
    condition: boolean,
    okFn: () => T,
    errFn: () => E
): Result<T, E> {
    return condition ? ok(okFn()) : err(errFn());
}
