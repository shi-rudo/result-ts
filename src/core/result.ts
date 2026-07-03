import { Pipeable } from './pipeable';
import { AsyncErrMatchBuilder, AsyncErrorMatchBuilder, ErrMatchBuilder, ErrorMatchBuilder } from './matcher';
import { RESULT_BRAND } from './brand';
import { isResult } from './isResult';
import { all, sequence } from './sequence';
import { combine } from './zip';
import {
    ExpectErrError,
    ExpectOkError,
    InvalidResultStateError,
    MatchOnOkError,
    UnwrapErrOnOkError,
    UnwrapOnErrError,
} from '../errors';

// --- 1. Helper Types ---

// An operator is a function that takes a Result and returns something else.
export type OperatorFunction<T, E, R> = (input: Result<T, E>) => R;
export type { Awaitable } from './pipeable';
export type AsyncOperatorFunction<T, E, R> = (input: Result<T, E>) => Promise<R>;

// --- 2. Result Types ---

export type ResultType<T, E> = { readonly _tag: 'Ok'; readonly value: T } | { readonly _tag: 'Err'; readonly error: E };

export type Result<T, E> = Ok<T, E> | Err<T, E>;
type OkValue<R> = R extends { readonly _tag: 'Ok'; readonly value: infer T } ? T : never;

abstract class ResultBase extends Pipeable {
    abstract readonly _tag: 'Ok' | 'Err';

    // Basic helpers for internal access in operators
    isOk<T, E>(this: Result<T, E>): this is Ok<T, E> {
        if (this._tag === 'Ok') return true;
        if (this._tag === 'Err') return false;
        throw new InvalidResultStateError('Result.isOk');
    }

    isErr<T, E>(this: Result<T, E>): this is Err<T, E> {
        if (this._tag === 'Err') return true;
        if (this._tag === 'Ok') return false;
        throw new InvalidResultStateError('Result.isErr');
    }

    unwrapOr<T, E>(this: Result<T, E>, defaultValue: T): T {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') return defaultValue;
        throw new InvalidResultStateError('Result.unwrapOr');
    }

    unwrap<T, E>(this: Result<T, E>): T {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') throw new UnwrapOnErrError(this.error);
        throw new InvalidResultStateError('Result.unwrap');
    }

    unwrapErr<T, E>(this: Result<T, E>): E {
        if (this._tag === 'Err') return this.error;
        if (this._tag === 'Ok') throw new UnwrapErrOnOkError(this.value);
        throw new InvalidResultStateError('Result.unwrapErr');
    }

    unwrapOrElse<T, E>(this: Result<T, E>, fn: (error: E) => T): T {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') return fn(this.error);
        throw new InvalidResultStateError('Result.unwrapOrElse');
    }

    unwrapOrThrow<T, E>(this: Result<T, E>): T {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') throw this.error;
        throw new InvalidResultStateError('Result.unwrapOrThrow');
    }

    expect<T, E>(this: Result<T, E>, message: string): T {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') throw new ExpectOkError(message, this.error);
        throw new InvalidResultStateError('Result.expect');
    }

    expectErr<T, E>(this: Result<T, E>, message: string): E {
        if (this._tag === 'Err') return this.error;
        if (this._tag === 'Ok') throw new ExpectErrError(message, this.value);
        throw new InvalidResultStateError('Result.expectErr');
    }

    toPromise<T, E>(this: Result<T, E>): Promise<T> {
        if (this._tag === 'Ok') return Promise.resolve(this.value);
        if (this._tag === 'Err') return Promise.reject(this.error);
        throw new InvalidResultStateError('Result.toPromise');
    }

    toNullable<T, E>(this: Result<T, E>): T | null {
        if (this._tag === 'Ok') return this.value;
        if (this._tag === 'Err') return null;
        throw new InvalidResultStateError('Result.toNullable');
    }

    /**
     * Folds the Result into a single value by applying one of two functions.
     */
    fold<T, E, R1, R2 = R1>(this: Result<T, E>, onOk: (value: T) => R1, onErr: (error: E) => R2): R1 | R2 {
        if (this._tag === 'Ok') return onOk(this.value);
        if (this._tag === 'Err') return onErr(this.error);
        throw new InvalidResultStateError('Result.fold');
    }

    /**
     * Enables `yield* result` in generators (Do-notation).
     *
     * The iterator yields the `Result` itself; the runner (see `task`) decides:
     * - Ok  → sends back the Ok value (`next(value)`), `yield*` yields `T`
     * - Err → aborts and returns the Err Result
     */
    *[Symbol.iterator](): Generator<this, OkValue<this>, unknown> {
        return (yield this) as OkValue<this>;
    }

    matchError<T, E>(this: Result<T, E>): ErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new ErrorMatchBuilder(this.error);
        if (this._tag === 'Ok') throw new MatchOnOkError('matchError');
        throw new InvalidResultStateError('Result.matchError');
    }

    matchErrorAsync<T, E>(this: Result<T, E>): AsyncErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new AsyncErrorMatchBuilder(this.error);
        if (this._tag === 'Ok') throw new MatchOnOkError('matchErrorAsync');
        throw new InvalidResultStateError('Result.matchErrorAsync');
    }

    /**
     * Matches on the **Err** value via a `.when(...)` chain.
     *
     * Not the same as the `match({ ok, err })` pipe operator: that operator resolves
     * **both** branches (Ok and Err) via callbacks, whereas this method is **Err-only**
     * and returns an {@link ErrorMatchBuilder}.
     *
     * Note: for type-safety reasons, `.match()` can only be called on a Result already
     * narrowed to `Err`, e.g. inside `if (result.isErr()) { ... }`.
     *
     * @deprecated Use `.matchError()` for clearer Err-only semantics. For Ok+Err handling,
     * use the `match({ ok, err })` pipe operator instead.
     */
    match<T, E>(this: Result<T, E>): ErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new ErrorMatchBuilder(this.error);
        if (this._tag === 'Ok') throw new MatchOnOkError();
        throw new InvalidResultStateError('Result.match');
    }

    /**
     * Matches on the Err value, but normalizes every branch to a `Result`:
     * - Handlers must return a `Result`
     * - use `ok(...)` for recovery and `err(...)` for mapped errors
     */
    matchErr<T, E>(this: Result<T, E>): ErrMatchBuilder<T, E, never, never> {
        return ErrMatchBuilder.fromResult(this);
    }

    matchErrAsync<T, E>(this: Result<T, E>): AsyncErrMatchBuilder<T, E, never, never> {
        return AsyncErrMatchBuilder.fromResult(this);
    }

    /**
     * Serializes the Result into a simple object format.
     * Preserves the original types.
     */
    serialize<T, E>(this: Result<T, E>): { isSuccess: boolean; data?: T; error?: E } {
        if (this._tag === 'Ok') return { isSuccess: true, data: this.value };
        if (this._tag === 'Err') return { isSuccess: false, error: this.error };
        throw new InvalidResultStateError('Result.serialize');
    }

    /**
     * Serializes the Result into a user-friendly format.
     * Converts Errors to readable strings.
     */
    toUserFriendly<T, E>(this: Result<T, E>): { isSuccess: boolean; data?: T; error?: string } {
        if (this._tag === 'Ok') return { isSuccess: true, data: this.value };
        if (this._tag !== 'Err') throw new InvalidResultStateError('Result.toUserFriendly');

        const error = this.error;
        const errorMessage =
            error && typeof error === 'object' && 'message' in error
                ? String((error as { message: unknown }).message)
                : String(error);

        return { isSuccess: false, error: errorMessage };
    }
}

// The brand lives on the shared prototype instead of each instance: a
// per-instance defineProperty forces a shape transition on every Result
// construction. isResult() reads the brand through the prototype chain.
Object.defineProperty(ResultBase.prototype, RESULT_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
});

export class Ok<T, E = never> extends ResultBase {
    readonly _tag = 'Ok' as const;
    readonly value: T;

    constructor(value: T) {
        super();
        this.value = value;
        Object.freeze(this);
    }
}

export class Err<T = never, E = never> extends ResultBase {
    readonly _tag = 'Err' as const;
    readonly error: E;

    constructor(error: E) {
        super();
        this.error = error;
        Object.freeze(this);
    }
}

export function ok(): Result<void, never>;
export function ok<T, E = never>(value: T): Result<T, E>;
export function ok<T, E = never>(value?: T): Result<T, E> {
    return new Ok<T, E>(value as T);
}

export function err<E, T = never>(error: E): Result<T, E> {
    return new Err<T, E>(error);
}

export function okIf<T, E>(condition: boolean, okValue: T, errValue: E): Result<T, E> {
    return condition ? ok<T, E>(okValue) : err<E, T>(errValue);
}

export function okIfLazy<T, E>(condition: boolean, okFn: () => T, errFn: () => E): Result<T, E> {
    return condition ? ok<T, E>(okFn()) : err<E, T>(errFn());
}

export function fromNullable<T, E>(value: T, error: E): Result<NonNullable<T>, E> {
    if (value === null || value === undefined) {
        return err<E, NonNullable<T>>(error);
    }
    return ok<NonNullable<T>, E>(value as NonNullable<T>);
}

export function fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
export function fromPromise<T, E>(promise: Promise<T>, errorMapper: (error: unknown) => E): Promise<Result<T, E>>;
export async function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
    try {
        const value = await promise;
        return ok(value);
    } catch (error) {
        return err(errorMapper ? errorMapper(error) : (error as E));
    }
}

export function tryFn<T>(fn: () => T): Result<T, unknown> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error);
    }
}

export function fromThrowable<const Args extends readonly unknown[], T>(
    fn: (...args: Args) => T
): (...args: Args) => Result<T, unknown>;
export function fromThrowable<const Args extends readonly unknown[], T, E>(
    fn: (...args: Args) => T,
    errorMapper: (error: unknown) => E
): (...args: Args) => Result<T, E>;
export function fromThrowable<const Args extends readonly unknown[], T, E>(
    fn: (...args: Args) => T,
    errorMapper?: (error: unknown) => E
): (...args: Args) => Result<T, E> {
    return (...args) => {
        try {
            return ok<T, E>(fn(...args));
        } catch (error) {
            return err<E, T>(errorMapper ? errorMapper(error) : (error as E));
        }
    };
}

export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>>;
export async function tryAsync<T, E>(fn: () => Promise<T>, errorMapper: (error: unknown) => E): Promise<Result<T, E>>;
export async function tryAsync<T, E>(fn: () => Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
    try {
        return ok<T, E>(await fn());
    } catch (error) {
        return err<E, T>(errorMapper ? errorMapper(error) : (error as E));
    }
}

export const Result: {
    ok: typeof ok;
    err: typeof err;
    is: typeof isResult;
    fromNullable: typeof fromNullable;
    fromPromise: typeof fromPromise;
    fromThrowable: typeof fromThrowable;
    try: typeof tryFn;
    tryAsync: typeof tryAsync;
    sequence: typeof sequence;
    all: typeof all;
    combine: typeof combine;
} = {
    ok,
    err,
    is: isResult,
    fromNullable,
    fromPromise,
    fromThrowable,
    try: tryFn,
    tryAsync,
    sequence,
    all,
    combine,
};
