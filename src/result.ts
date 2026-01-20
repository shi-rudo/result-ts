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

// --- 2. Result Types ---

export type ResultType<T, E> = { readonly _tag: 'Ok'; readonly value: T } | { readonly _tag: 'Err'; readonly error: E };

export type Result<T, E> = Ok<T, E> | Err<T, E>;

abstract class ResultBase<T, E> extends Pipeable {
    protected readonly _state: ResultType<unknown, unknown>;
    abstract readonly _tag: 'Ok' | 'Err';
    abstract readonly value: unknown;
    abstract readonly error: unknown;

    protected constructor(state: ResultType<unknown, unknown>) {
        super();
        Object.freeze(state);
        this._state = state;
    }

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
    isOk(): this is Ok<T, never> {
        return this._tag === 'Ok';
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
    isErr(): this is Err<never, E> {
        return this._tag === 'Err';
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
        if (this._tag === 'Ok') {
            return (this as Ok<T, E>).value;
        }
        // Safe string conversion for error messages
        const errorStr = (() => {
            try {
                const error = this.error;
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
        if (this._tag === 'Err') {
            return (this as Err<T, E>).error;
        }
        // Safe string conversion for error messages
        const valueStr = (() => {
            try {
                const value = this.value;
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
        if (this._tag === 'Ok') {
            return (this as Ok<T, E>).value;
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
        if (this._tag === 'Err') {
            return (this as Err<T, E>).error;
        }
        throw new Error(message);
    }

    unwrapOr<D = T>(defaultValue: D): T | D {
        return this._tag === 'Ok' ? (this as Ok<T, E>).value : defaultValue;
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
        return toPromiseFn(this as Result<T, E>);
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
        return toNullableFn(this as Result<T, E>);
    }

    /**
     * Enables `yield* result` in generators (Do-notation).
     *
     * The iterator yields the `Result` itself; the runner (see `task`) decides:
     * - Ok  → sends back the Ok value (`next(value)`), `yield*` yields `T`
     * - Err → aborts and returns the Err Result
     */
    *[Symbol.iterator](): Generator<Result<T, E>, T, unknown> {
        return (yield (this as Result<T, E>)) as T;
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
        return ResultMatchBuilder.fromResult(this as Result<T, E>);
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
    matchErr(): ErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new ErrorMatchBuilder((this as Err<T, E>).error);
        throw new Error('matchErr() can only be called on Err results. Use `if (result.isErr()) { ... }` first.');
    }

    /**
     * Matches on the Err value, but normalizes every branch to a `Result`:
     * - Handlers may return a `Result` (returned directly)
     * - or an error value (wrapped to `Err(error)`)
     */
    matchErrResult(): ErrMatchBuilder<T, E, never, never> {
        const makeErr = <ErrValue>(error: ErrValue) => err<ErrValue, never>(error);
        return ErrMatchBuilder.fromResult(this as Result<T, E>, makeErr);
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
     * 
     * @example
     * ```ts
     * // Works with discriminated unions
     * const result: Result<string, number> = err(404);
     * const response = result.fold(
     *     data => ({ success: true as const, data }),
     *     code => ({ success: false as const, code })
     * );
     * // response: { success: true; data: string } | { success: false; code: number }
     * ```
     */
    fold<R1, R2 = R1>(onOk: (value: T) => R1, onErr: (error: E) => R2): R1 | R2 {
        if (this._tag === 'Ok') {
            return onOk((this as Ok<T, E>).value);
        }
        if (this._tag === 'Err') {
            return onErr((this as Err<T, E>).error);
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    /**
     * Returns the Result as a discriminated union (`{ _tag: 'Ok', value } | { _tag: 'Err', error }`).
     * Useful for libraries like `ts-pattern` that match on plain object unions.
     */
    toUnion(): ResultType<T, E> {
        return (this as ResultBase<T, E>)._state as ResultType<T, E>;
    }

    /**
     * Serializes the Result into a simple object format.
     * Preserves the original types.
     */
    serialize(): { isSuccess: boolean; data?: T; error?: E } {
        if (this._tag === 'Ok') return { isSuccess: true, data: (this as Ok<T, E>).value };
        return { isSuccess: false, error: (this as Err<T, E>).error };
    }

    /**
     * Serializes the Result into a user-friendly format.
     * Converts errors to readable strings.
     */
    toUserFriendly(): { isSuccess: boolean; data?: T; error?: string } {
        if (this._tag === 'Ok') return { isSuccess: true, data: (this as Ok<T, E>).value };

        const error = (this as Err<T, E>).error;
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

export class Ok<T, E = never> extends ResultBase<T, E> {
    readonly _tag = 'Ok' as const;
    readonly value: T;
    readonly error = undefined;

    constructor(value: T) {
        const state: { readonly _tag: 'Ok'; readonly value: T } = { _tag: 'Ok', value };
        super(state);
        this.value = value;
        Object.freeze(this);
    }
}

export class Err<T = never, E = never> extends ResultBase<T, E> {
    readonly _tag = 'Err' as const;
    readonly value = undefined;
    readonly error: E;

    constructor(error: E) {
        const state: { readonly _tag: 'Err'; readonly error: E } = { _tag: 'Err', error };
        super(state);
        this.error = error;
        Object.freeze(this);
    }
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
export function ok<T, E = never>(value: T): Result<T, E> {
    return new Ok<T, E>(value);
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
export function err<E, T = never>(error: E): Result<T, E> {
    return new Err<T, E>(error);
}

function fromNullable<T, E>(value: T, error: E): Result<NonNullable<T>, E> {
    return fromNullableFn(value, error);
}

function fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>>;
function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
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
function resultTry<T>(fn: () => T): Result<T, unknown> {
    return tryFn(fn);
}

export const Result = {
    ok,
    err,
    fromNullable,
    fromPromise,
    try: resultTry,
};

export function okIf<T, E>(
    condition: boolean,
    okValue: T,
    errValue: E
): Result<T, E> {
    return condition ? ok<T, E>(okValue) : err<E, T>(errValue);
}

export function okIfLazy<T, E>(
    condition: boolean,
    okFn: () => T,
    errFn: () => E
): Result<T, E> {
    if (condition) return ok<T, E>(okFn());
    return err<E, T>(errFn());
}
