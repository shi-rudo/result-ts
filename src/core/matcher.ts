import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

export type Ctor<T> = abstract new (...args: any[]) => T;
export type TypeGuard<E, A extends E> = (error: E) => error is A;

/**
 * Matcher für Err-Values (liefert einen beliebigen Return-Type, z.B. string messages).
 *
 * - `.when(Ctor, handler)` matched via `instanceof`
 * - `.whenGuard(guard, handler)` matched via Type-Guard
 * - `.run()` ist nur erlaubt, wenn alle Error-Cases behandelt wurden (`E` wurde zu `never` reduziert)
 */
export class ErrorMatchBuilder<E, R> {
    readonly #error: unknown;
    readonly #matched: boolean;
    readonly #value: unknown;

    constructor(error: unknown, matched = false, value?: unknown) {
        this.#error = error;
        this.#matched = matched;
        this.#value = value;
        Object.freeze(this);
    }

    when<C extends Ctor<E>, R1>(
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): ErrorMatchBuilder<Exclude<E, InstanceType<C>>, R | R1> {
        if (this.#matched) return this as unknown as ErrorMatchBuilder<Exclude<E, InstanceType<C>>, R | R1>;

        if (this.#error instanceof ctor) {
            return new ErrorMatchBuilder(this.#error, true, handler(this.#error as InstanceType<C>)) as unknown as ErrorMatchBuilder<
                Exclude<E, InstanceType<C>>,
                R | R1
            >;
        }

        return this as unknown as ErrorMatchBuilder<Exclude<E, InstanceType<C>>, R | R1>;
    }

    whenGuard<A extends E, R1>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => R1
    ): ErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;

        const error = this.#error as E;
        if (guard(error)) {
            return new ErrorMatchBuilder(this.#error, true, handler(error)) as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;
        }

        return this as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;
    }

    otherwise<R2>(handler: (error: E) => R2): R | R2 {
        if (this.#matched) return this.#value as R;
        return handler(this.#error as E);
    }

    run(this: ErrorMatchBuilder<never, R>): R {
        if (this.#matched) return this.#value as R;
        throw this.#error;
    }
}

type OkOfReturn<R> = R extends Result<infer T, any> ? T : never;
type ErrOfReturn<R> = R extends Result<any, infer E> ? E : R;

type ErrFactory = <E>(error: E) => Result<never, E>;

function isResult(value: unknown): value is Result<any, any> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'isOk' in value &&
        typeof (value as any).isOk === 'function' &&
        'isErr' in value &&
        typeof (value as any).isErr === 'function'
    );
}

/**
 * Matcher für `Result`-Errors, der immer wieder ein `Result` zurückgibt.
 *
 * Handler dürfen:
 * - ein `Result` zurückgeben (wird direkt returned)
 * - einen Error-Wert zurückgeben (wird automatisch zu `Err(error)` gewrappt)
 */
export class ErrMatchBuilder<T, E, OutT, OutE> {
    readonly #makeErr: ErrFactory;
    readonly #error: unknown;
    readonly #resolved: Result<any, any> | undefined;

    private constructor(makeErr: ErrFactory, error: unknown, resolved?: Result<any, any>) {
        this.#makeErr = makeErr;
        this.#error = error;
        this.#resolved = resolved;
        Object.freeze(this);
    }

    static fromResult<T, E>(result: Result<T, E>, makeErr: ErrFactory): ErrMatchBuilder<T, E, never, never> {
        if (result.isOk()) return new ErrMatchBuilder<T, E, never, never>(makeErr, undefined, result);
        if (result.isErr()) return new ErrMatchBuilder<T, E, never, never>(makeErr, result.error);
        throw new InvalidResultStateError('ErrMatchBuilder.fromResult');
    }

    when<C extends Ctor<E>, R1>(
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): ErrMatchBuilder<T, Exclude<E, InstanceType<C>>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>> {
        if (this.#resolved) {
            return this as unknown as ErrMatchBuilder<T, Exclude<E, InstanceType<C>>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>>;
        }

        if (this.#error instanceof ctor) {
            const out = handler(this.#error as InstanceType<C>);
            const resolved = isResult(out) ? out : this.#makeErr(out as ErrOfReturn<R1>);
            return new ErrMatchBuilder(this.#makeErr, this.#error, resolved) as unknown as ErrMatchBuilder<
                T,
                Exclude<E, InstanceType<C>>,
                OutT | OkOfReturn<R1>,
                OutE | ErrOfReturn<R1>
            >;
        }

        return this as unknown as ErrMatchBuilder<T, Exclude<E, InstanceType<C>>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>>;
    }

    whenGuard<A extends E, R1>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => R1
    ): ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>> {
        if (this.#resolved) return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>>;

        const error = this.#error as E;
        if (guard(error)) {
            const out = handler(error);
            const resolved = isResult(out) ? out : this.#makeErr(out as ErrOfReturn<R1>);
            return new ErrMatchBuilder(this.#makeErr, this.#error, resolved) as unknown as ErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfReturn<R1>,
                OutE | ErrOfReturn<R1>
            >;
        }

        return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>>;
    }

    otherwise<R2>(handler: (error: E) => R2): Result<T | OutT | OkOfReturn<R2>, OutE | ErrOfReturn<R2>> {
        if (this.#resolved) return this.#resolved as Result<T | OutT | OkOfReturn<R2>, OutE | ErrOfReturn<R2>>;

        const out = handler(this.#error as E);
        return (isResult(out) ? out : this.#makeErr(out as ErrOfReturn<R2>)) as Result<
            T | OutT | OkOfReturn<R2>,
            OutE | ErrOfReturn<R2>
        >;
    }

    run(this: ErrMatchBuilder<T, never, OutT, OutE>): Result<T | OutT, OutE> {
        if (this.#resolved) return this.#resolved as Result<T | OutT, OutE>;
        throw this.#error;
    }
}
