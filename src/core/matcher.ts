import type { Result } from './result';
import { InvalidResultStateError, MatchErrHandlerNotResultError } from '../errors';
import { isResult } from './isResult';

export type Ctor<T> = abstract new (...args: any[]) => T;
export type TypeGuard<E, A extends E> = (error: E) => error is A;
type TaggedBy<K extends PropertyKey, V extends PropertyKey> = { readonly [P in K]: V };
type Awaitable<T> = T | Promise<T>;

const matchesTag = <K extends PropertyKey, V extends PropertyKey>(value: unknown, key: K, tag: V): boolean => {
    return value !== null && typeof value === 'object' && (value as Record<PropertyKey, unknown>)[key] === tag;
};

/**
 * Matcher for Err values (returns an arbitrary return type, e.g. string messages).
 *
 * - `.when(Ctor, handler)` matches via `instanceof`
 * - `.whenGuard(guard, handler)` matches via Type-Guard
 * - `.run()` is only allowed if all error cases have been handled (`E` has been reduced to `never`)
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

    when<A extends E, R1>(
        ctor: Ctor<A>,
        handler: (error: A) => R1
    ): ErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;

        if (this.#error instanceof ctor) {
            return new ErrorMatchBuilder(this.#error, true, handler(this.#error as A)) as unknown as ErrorMatchBuilder<
                Exclude<E, A>,
                R | R1
            >;
        }

        return this as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;
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

    whenTag<K extends PropertyKey, V extends PropertyKey, A extends E = Extract<E, TaggedBy<K, V>>, R1 = never>(
        key: K,
        tag: V,
        handler: (error: A) => R1
    ): ErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as ErrorMatchBuilder<Exclude<E, A>, R | R1>;

        if (matchesTag(this.#error, key, tag)) {
            return new ErrorMatchBuilder(this.#error, true, handler(this.#error as A)) as unknown as ErrorMatchBuilder<
                Exclude<E, A>,
                R | R1
            >;
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

export class AsyncErrorMatchBuilder<E, R> {
    readonly #error: unknown;
    readonly #matched: boolean;
    readonly #value: Promise<unknown> | undefined;

    constructor(error: unknown, matched = false, value?: Promise<unknown>) {
        this.#error = error;
        this.#matched = matched;
        this.#value = value;
        Object.freeze(this);
    }

    when<A extends E, R1>(
        ctor: Ctor<A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;

        if (this.#error instanceof ctor) {
            const value = Promise.resolve().then(() => handler(this.#error as A));
            return new AsyncErrorMatchBuilder(this.#error, true, value) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
        }

        return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
    }

    whenGuard<A extends E, R1>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;

        const error = this.#error as E;
        if (guard(error)) {
            const value = Promise.resolve().then(() => handler(error));
            return new AsyncErrorMatchBuilder(this.#error, true, value) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
        }

        return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
    }

    whenTag<K extends PropertyKey, V extends PropertyKey, A extends E = Extract<E, TaggedBy<K, V>>, R1 = never>(
        key: K,
        tag: V,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;

        if (matchesTag(this.#error, key, tag)) {
            const value = Promise.resolve().then(() => handler(this.#error as A));
            return new AsyncErrorMatchBuilder(this.#error, true, value) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
        }

        return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
    }

    async otherwise<R2>(handler: (error: E) => Awaitable<R2>): Promise<R | R2> {
        if (this.#matched) return await this.#value as R;
        return await handler(this.#error as E);
    }

    async run(this: AsyncErrorMatchBuilder<never, R>): Promise<R> {
        if (this.#matched) return await this.#value as R;
        throw this.#error;
    }
}

type OkOfResult<R> = R extends Result<infer T, any> ? T : never;
type ErrOfResult<R> = R extends Result<any, infer E> ? E : never;

const expectResultReturn = (value: unknown, handlerName: string): Result<any, any> => {
    if (isResult(value)) return value;
    throw new MatchErrHandlerNotResultError(handlerName, value);
};

/**
 * Matcher for `Result` Errors, which returns a `Result` again.
 *
 * Handlers must return a `Result`.
 * Wrap recovered values with `ok(...)` and mapped errors with `err(...)`.
 */
export class ErrMatchBuilder<T, E, OutT, OutE> {
    readonly #error: unknown;
    readonly #resolved: Result<any, any> | undefined;

    private constructor(error: unknown, resolved?: Result<any, any>) {
        this.#error = error;
        this.#resolved = resolved;
        Object.freeze(this);
    }

    static fromResult<T, E>(result: Result<T, E>): ErrMatchBuilder<T, E, never, never> {
        if (result.isOk()) return new ErrMatchBuilder<T, E, never, never>(undefined, result);
        if (result.isErr()) return new ErrMatchBuilder<T, E, never, never>(result.error);
        throw new InvalidResultStateError('ErrMatchBuilder.fromResult');
    }

    when<A extends E, R1 extends Result<any, any>>(
        ctor: Ctor<A>,
        handler: (error: A) => R1
    ): ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) {
            return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
        }

        if (this.#error instanceof ctor) {
            const out = handler(this.#error as A);
            const resolved = expectResultReturn(out, 'when');
            return new ErrMatchBuilder(this.#error, resolved) as unknown as ErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    whenGuard<A extends E, R1 extends Result<any, any>>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => R1
    ): ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        const error = this.#error as E;
        if (guard(error)) {
            const out = handler(error);
            const resolved = expectResultReturn(out, 'whenGuard');
            return new ErrMatchBuilder(this.#error, resolved) as unknown as ErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    whenTag<K extends PropertyKey, V extends PropertyKey, A extends E = Extract<E, TaggedBy<K, V>>, R1 extends Result<any, any> = never>(
        key: K,
        tag: V,
        handler: (error: A) => R1
    ): ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        if (matchesTag(this.#error, key, tag)) {
            const out = handler(this.#error as A);
            const resolved = expectResultReturn(out, 'whenTag');
            return new ErrMatchBuilder(this.#error, resolved) as unknown as ErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    otherwise<R2 extends Result<any, any>>(handler: (error: E) => R2): Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>> {
        if (this.#resolved) return this.#resolved as Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>;

        const out = handler(this.#error as E);
        return expectResultReturn(out, 'otherwise') as Result<
            T | OutT | OkOfResult<R2>,
            OutE | ErrOfResult<R2>
        >;
    }

    run(this: ErrMatchBuilder<T, never, OutT, OutE>): Result<T | OutT, OutE> {
        if (this.#resolved) return this.#resolved as Result<T | OutT, OutE>;
        throw this.#error;
    }
}

export class AsyncErrMatchBuilder<T, E, OutT, OutE> {
    readonly #error: unknown;
    readonly #resolved: Promise<Result<any, any>> | undefined;

    private constructor(error: unknown, resolved?: Promise<Result<any, any>>) {
        this.#error = error;
        this.#resolved = resolved;
        Object.freeze(this);
    }

    static fromResult<T, E>(result: Result<T, E>): AsyncErrMatchBuilder<T, E, never, never> {
        if (result.isOk()) return new AsyncErrMatchBuilder<T, E, never, never>(undefined, Promise.resolve(result));
        if (result.isErr()) return new AsyncErrMatchBuilder<T, E, never, never>(result.error);
        throw new InvalidResultStateError('AsyncErrMatchBuilder.fromResult');
    }

    when<A extends E, R1 extends Result<any, any>>(
        ctor: Ctor<A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        if (this.#error instanceof ctor) {
            const resolved = Promise.resolve().then(() => handler(this.#error as A)).then(out => expectResultReturn(out, 'when'));
            return new AsyncErrMatchBuilder(this.#error, resolved) as unknown as AsyncErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    whenGuard<A extends E, R1 extends Result<any, any>>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        const error = this.#error as E;
        if (guard(error)) {
            const resolved = Promise.resolve().then(() => handler(error)).then(out => expectResultReturn(out, 'whenGuard'));
            return new AsyncErrMatchBuilder(this.#error, resolved) as unknown as AsyncErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    whenTag<K extends PropertyKey, V extends PropertyKey, A extends E = Extract<E, TaggedBy<K, V>>, R1 extends Result<any, any> = never>(
        key: K,
        tag: V,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolved) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        if (matchesTag(this.#error, key, tag)) {
            const resolved = Promise.resolve().then(() => handler(this.#error as A)).then(out => expectResultReturn(out, 'whenTag'));
            return new AsyncErrMatchBuilder(this.#error, resolved) as unknown as AsyncErrMatchBuilder<
                T,
                Exclude<E, A>,
                OutT | OkOfResult<R1>,
                OutE | ErrOfResult<R1>
            >;
        }

        return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;
    }

    async otherwise<R2 extends Result<any, any>>(
        handler: (error: E) => Awaitable<R2>
    ): Promise<Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>> {
        if (this.#resolved) return await this.#resolved as Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>;

        const out = await handler(this.#error as E);
        return expectResultReturn(out, 'otherwise') as Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>;
    }

    async run(this: AsyncErrMatchBuilder<T, never, OutT, OutE>): Promise<Result<T | OutT, OutE>> {
        if (this.#resolved) return await this.#resolved as Result<T | OutT, OutE>;
        throw this.#error;
    }
}
