import { Pipeable } from './pipeable';
import { ErrMatchBuilder, ErrorMatchBuilder } from './matcher';

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

// --- 1. Hilfstypen ---

// Ein Operator ist eine Funktion, die ein Result nimmt und etwas anderes zurückgibt.
export type OperatorFunction<T, E, R> = (input: Result<T, E>) => R;
export type { Awaitable } from './pipeable';
export type AsyncOperatorFunction<T, E, R> = (input: Result<T, E>) => Promise<R>;

// --- 2. Result Types ---

export type ResultType<T, E> = { readonly _tag: 'Ok'; readonly value: T } | { readonly _tag: 'Err'; readonly error: E };

export type Result<T, E> = Ok<T, E> | Err<T, E>;

abstract class ResultBase extends Pipeable {
    abstract readonly _tag: 'Ok' | 'Err';
    abstract readonly value: unknown;
    abstract readonly error: unknown;

    // Basic helpers für internen Zugriff in Operatoren
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
     * Matcht auf den Err-Wert via `.when(...)` Kette.
     *
     * Hinweis: aus Type-Safety-Gründen ist `.match()` nur auf einem bereits zu `Err` verengten Result aufrufbar,
     * z.B. innerhalb von `if (result.isErr()) { ... }`.
     */
    match<T, E>(this: Result<T, E>): ErrorMatchBuilder<E, never> {
        if (this._tag === 'Err') return new ErrorMatchBuilder(this.error);
        throw new Error('match() can only be called on Err results. Use `if (result.isErr()) { ... }` first.');
    }

    /**
     * Matcht auf den Err-Wert, aber normalisiert jeden Branch zu einem `Result`:
     * - Handler dürfen ein `Result` zurückgeben (wird direkt returned)
     * - oder einen Error-Wert (wird zu `Err(error)` gewrappt)
     */
    matchErr<T, E>(this: Result<T, E>): ErrMatchBuilder<T, E, never, never> {
        const makeErr = <ErrValue>(error: ErrValue) => err<ErrValue, never>(error);
        return ErrMatchBuilder.fromResult(this, makeErr);
    }

    /**
     * Serialisiert das Result in ein einfaches Objekt-Format.
     * Behält die ursprünglichen Typen bei.
     */
    serialize<T, E>(this: Result<T, E>): { isSuccess: boolean; data?: T; error?: E } {
        if (this._tag === 'Ok') return { isSuccess: true, data: this.value };
        return { isSuccess: false, error: this.error };
    }

    /**
     * Serialisiert das Result in ein user-friendly Format.
     * Konvertiert Errors zu lesbaren Strings.
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

export function ok<T, E = never>(value: T): Result<T, E> {
    return new Ok<T, E>(value);
}

export function err<E, T = never>(error: E): Result<T, E> {
    return new Err<T, E>(error);
}

export const Result = {
    ok,
    err,
};
