import { Pipeable } from './pipeable';
import { ErrMatchBuilder, ErrorMatchBuilder } from './matcher';
import { InvalidResultStateError, MatchOnOkError } from '../errors';

// Re-export pipe operators for convenience
export { map } from './map';
export { mapErr } from './mapErr';
export { bimap, mapBoth } from './mapBoth';
export { flatMap } from './flatMap';
export { zip, combine } from './zip';
export { tap } from './tap';
export { filter } from './filter';
export { match } from './match';
export { recover, recoverWith } from './recover';
export { swap } from './swap';
export { tryCatch } from './tryCatch';
export { tryMap } from './tryMap';
export { collectFirstOk } from './collectFirstOk';

// Async variants
export { mapAsync } from './mapAsync';
export { mapErrAsync } from './mapErrAsync';
export { flatMapAsync } from './flatMapAsync';
export { tapAsync } from './tapAsync';
export { filterAsync } from './filterAsync';
export { matchAsync } from './matchAsync';
export { tryCatchAsync } from './tryCatchAsync';
export { tryMapAsync } from './tryMapAsync';

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
    abstract readonly value: unknown;
    abstract readonly error: unknown;

    // Basic helpers for internal access in operators
    isOk<T, E>(this: Result<T, E>): this is Ok<T, E> {
        return this._tag === 'Ok';
    }

    isErr<T, E>(this: Result<T, E>): this is Err<T, E> {
        return this._tag === 'Err';
    }

    unwrapOr<T, E>(this: Result<T, E>, defaultValue: T): T {
        return this._tag === 'Ok' ? this.value : defaultValue;
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
    *[Symbol.iterator](): Generator<unknown, OkValue<this>, unknown> {
        return (yield this) as OkValue<this>;
    }

    /**
     * Matches on the Err value via `.when(...)` chain.
     *
     * Note: for type safety reasons, `.match()` can only be called on a Result already narrowed to `Err`,
     * e.g. inside `if (result.isErr()) { ... }`.
     */
    match<T, E>(this: Result<T, E>): ErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new ErrorMatchBuilder(this.error);
        throw new MatchOnOkError();
    }

    /**
     * Matches on the Err value, but normalizes every branch to a `Result`:
     * - Handlers may return a `Result` (is returned directly)
     * - or an Error value (is wrapped into `Err(error)`)
     */
    matchErr<T, E>(this: Result<T, E>): ErrMatchBuilder<T, E, never, never> {
        const makeErr = <ErrValue>(error: ErrValue) => err<ErrValue, never>(error);
        return ErrMatchBuilder.fromResult(this, makeErr);
    }

    /**
     * Serializes the Result into a simple object format.
     * Preserves the original types.
     */
    serialize<T, E>(this: Result<T, E>): { isSuccess: boolean; data?: T; error?: E } {
        if (this._tag === 'Ok') return { isSuccess: true, data: this.value };
        return { isSuccess: false, error: this.error };
    }

    /**
     * Serializes the Result into a user-friendly format.
     * Converts Errors to readable strings.
     */
    toUserFriendly<T, E>(this: Result<T, E>): { isSuccess: boolean; data?: T; error?: string } {
        if (this._tag === 'Ok') return { isSuccess: true, data: this.value };

        const error = this.error;
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);

        return { isSuccess: false, error: errorMessage };
    }
}

export class Ok<T, E = never> extends ResultBase {
    readonly _tag = 'Ok' as const;
    readonly value: T;
    readonly error = undefined;

    constructor(value: T) {
        super();
        this.value = value;
        Object.freeze(this);
    }
}

export class Err<T = never, E = never> extends ResultBase {
    readonly _tag = 'Err' as const;
    readonly value = undefined;
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
export function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>>;
export async function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
    try {
        const value = await promise;
        return ok(value);
    } catch (error) {
        try {
            return err(errorMapper ? errorMapper(error) : (error as E));
        } catch (mapperError) {
            return err(mapperError as E);
        }
    }
}

export function tryFn<T>(fn: () => T): Result<T, unknown> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error);
    }
}

export const Result = {
    ok,
    err,
    fromNullable,
    fromPromise,
    try: tryFn,
};
