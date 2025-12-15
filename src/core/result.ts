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

// --- 2. Die Klasse Result ---

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

    static ok<T, E = never>(value: T): Result<T, E> {
        return new Result<T, E>({ _tag: 'Ok', value });
    }

    static err<E, T = never>(error: E): Result<T, E> {
        return new Result<T, E>({ _tag: 'Err', error });
    }

    // Basic helpers für internen Zugriff in Operatoren
    isOk(): this is Result<T, E> & { readonly value: T; readonly error: undefined } {
        return this.#state._tag === 'Ok';
    }

    isErr(): this is Result<T, E> & { readonly value: undefined; readonly error: E } {
        return this.#state._tag === 'Err';
    }

    get value(): T | undefined {
        return this.#state._tag === 'Ok' ? this.#state.value : undefined;
    }

    get error(): E | undefined {
        return this.#state._tag === 'Err' ? this.#state.error : undefined;
    }

    unwrapOr(defaultValue: T): T {
        return this.#state._tag === 'Ok' ? this.#state.value : defaultValue;
    }

    /**
     * Matcht auf den Err-Wert via `.when(...)` Kette.
     *
     * Hinweis: aus Type-Safety-Gründen ist `.match()` nur auf einem bereits zu `Err` verengten Result aufrufbar,
     * z.B. innerhalb von `if (result.isErr()) { ... }`.
     */
    match(this: Result<T, E> & { readonly error: E }): ErrorMatchBuilder<E, never>;
    match(this: Result<T, E>): never;
    match(): unknown {
        if (this.isErr()) return new ErrorMatchBuilder(this.error);
        throw new Error('match() can only be called on Err results. Use `if (result.isErr()) { ... }` first.');
    }

    /**
     * Matcht auf den Err-Wert, aber normalisiert jeden Branch zu einem `Result`:
     * - Handler dürfen ein `Result` zurückgeben (wird direkt returned)
     * - oder einen Error-Wert (wird zu `Err(error)` gewrappt)
     */
    matchErr(): ErrMatchBuilder<T, E, never, never> {
        const makeErr = <Err>(error: Err) => Result.err<Err, never>(error);
        return ErrMatchBuilder.fromResult(this, makeErr);
    }

    /**
     * Serialisiert das Result in ein einfaches Objekt-Format.
     * Behält die ursprünglichen Typen bei.
     */
    serialize(): { isSuccess: boolean; data?: T; error?: E } {
        if (this.#state._tag === 'Ok') return { isSuccess: true, data: this.#state.value };
        return { isSuccess: false, error: this.#state.error };
    }

    /**
     * Serialisiert das Result in ein user-friendly Format.
     * Konvertiert Errors zu lesbaren Strings.
     */
    toUserFriendly(): { isSuccess: boolean; data?: T; error?: string } {
        if (this.#state._tag === 'Ok') return { isSuccess: true, data: this.#state.value };

        const error = this.#state.error;
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);

        return { isSuccess: false, error: errorMessage };
    }

}

// Helper Konstruktoren
export const ok = Result.ok;
export const err = Result.err;
