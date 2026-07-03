import type { Result } from './result';
import { InvalidResultStateError, MatchErrHandlerNotResultError, MatchOnOkError } from '../errors';
import { isResult } from './isResult';

export type Ctor<T> = abstract new (...args: any[]) => T;
export type TypeGuard<E, A extends E> = (error: E) => error is A;
type TaggedBy<K extends PropertyKey, V extends PropertyKey> = { readonly [P in K]: V };
type Awaitable<T> = T | Promise<T>;
type TagValue<E, K extends keyof E> = Extract<E[K], PropertyKey>;
type TagHandlerMap<E, K extends keyof E> = {
    readonly [V in TagValue<E, K>]: (error: Extract<E, Record<K, V>>) => unknown;
};
type TagHandlerReturn<Handlers> = {
    [K in keyof Handlers]: Handlers[K] extends (...args: any[]) => infer R ? R : never;
}[keyof Handlers];

const matchesTag = <K extends PropertyKey, V extends PropertyKey>(value: unknown, key: K, tag: V): boolean => {
    return value !== null && typeof value === 'object' && (value as Record<PropertyKey, unknown>)[key] === tag;
};

export function matchTag<
    T,
    K extends keyof E & PropertyKey,
    E extends Record<K, PropertyKey>,
    Handlers extends TagHandlerMap<E, K>,
>(
    result: Result<T, E>,
    key: K,
    handlers: Handlers
): TagHandlerReturn<Handlers> {
    if (result.isOk()) throw new MatchOnOkError('matchTag');

    if (result.isErr()) {
        const error = result.error;
        const tag = error[key];
        const handler = handlers[tag as unknown as keyof Handlers];

        if (typeof handler !== 'function') throw new InvalidResultStateError('matchTag');

        return (handler as (matchedError: never) => TagHandlerReturn<Handlers>)(error as never);
    }

    throw new InvalidResultStateError('matchTag');
}

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
    readonly #handler: (() => Awaitable<unknown>) | undefined;
    // Lazily created on first run()/otherwise() so abandoned chains never
    // start the handler (and thus can never leak an unhandled rejection).
    #memo: Promise<unknown> | undefined;

    constructor(error: unknown, matched = false, handler?: () => Awaitable<unknown>) {
        this.#error = error;
        this.#matched = matched;
        this.#handler = handler;
        Object.freeze(this);
    }

    when<A extends E, R1>(
        ctor: Ctor<A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrorMatchBuilder<Exclude<E, A>, R | R1> {
        if (this.#matched) return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;

        if (this.#error instanceof ctor) {
            const run = (): Awaitable<R1> => handler(this.#error as A);
            return new AsyncErrorMatchBuilder(this.#error, true, run) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
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
            const run = (): Awaitable<R1> => handler(error);
            return new AsyncErrorMatchBuilder(this.#error, true, run) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
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
            const run = (): Awaitable<R1> => handler(this.#error as A);
            return new AsyncErrorMatchBuilder(this.#error, true, run) as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
        }

        return this as unknown as AsyncErrorMatchBuilder<Exclude<E, A>, R | R1>;
    }

    async otherwise<R2>(handler: (error: E) => Awaitable<R2>): Promise<R | R2> {
        if (this.#matched) return await this.#invoke() as R;
        return await handler(this.#error as E);
    }

    async run(this: AsyncErrorMatchBuilder<never, R>): Promise<R> {
        if (this.#matched) return await this.#invoke() as R;
        throw this.#error;
    }

    #invoke(): Promise<unknown> {
        // Private fields stay writable on frozen instances, so the memo works.
        this.#memo ??= Promise.resolve().then(this.#handler);
        return this.#memo;
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
    readonly #resolve: (() => Awaitable<Result<any, any>>) | undefined;
    // Lazily created on first run()/otherwise() so abandoned chains never
    // start the handler (and thus can never leak an unhandled rejection).
    #memo: Promise<Result<any, any>> | undefined;

    private constructor(error: unknown, resolve?: () => Awaitable<Result<any, any>>) {
        this.#error = error;
        this.#resolve = resolve;
        Object.freeze(this);
    }

    static fromResult<T, E>(result: Result<T, E>): AsyncErrMatchBuilder<T, E, never, never> {
        if (result.isOk()) return new AsyncErrMatchBuilder<T, E, never, never>(undefined, () => result);
        if (result.isErr()) return new AsyncErrMatchBuilder<T, E, never, never>(result.error);
        throw new InvalidResultStateError('AsyncErrMatchBuilder.fromResult');
    }

    when<A extends E, R1 extends Result<any, any>>(
        ctor: Ctor<A>,
        handler: (error: A) => Awaitable<R1>
    ): AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>> {
        if (this.#resolve) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        if (this.#error instanceof ctor) {
            const resolve = async (): Promise<Result<any, any>> => expectResultReturn(await handler(this.#error as A), 'when');
            return new AsyncErrMatchBuilder(this.#error, resolve) as unknown as AsyncErrMatchBuilder<
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
        if (this.#resolve) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        const error = this.#error as E;
        if (guard(error)) {
            const resolve = async (): Promise<Result<any, any>> => expectResultReturn(await handler(error), 'whenGuard');
            return new AsyncErrMatchBuilder(this.#error, resolve) as unknown as AsyncErrMatchBuilder<
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
        if (this.#resolve) return this as unknown as AsyncErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfResult<R1>, OutE | ErrOfResult<R1>>;

        if (matchesTag(this.#error, key, tag)) {
            const resolve = async (): Promise<Result<any, any>> => expectResultReturn(await handler(this.#error as A), 'whenTag');
            return new AsyncErrMatchBuilder(this.#error, resolve) as unknown as AsyncErrMatchBuilder<
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
        if (this.#resolve) return await this.#invoke() as Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>;

        const out = await handler(this.#error as E);
        return expectResultReturn(out, 'otherwise') as Result<T | OutT | OkOfResult<R2>, OutE | ErrOfResult<R2>>;
    }

    async run(this: AsyncErrMatchBuilder<T, never, OutT, OutE>): Promise<Result<T | OutT, OutE>> {
        if (this.#resolve) return await this.#invoke() as Result<T | OutT, OutE>;
        throw this.#error;
    }

    #invoke(): Promise<Result<any, any>> {
        // Private fields stay writable on frozen instances, so the memo works.
        this.#memo ??= Promise.resolve().then(this.#resolve);
        return this.#memo;
    }
}
