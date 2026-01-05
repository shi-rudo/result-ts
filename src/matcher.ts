import type { Result } from './result';
import { isResult } from './utils/isResult';

export type Ctor<T> = abstract new (...args: any[]) => T;
export type TypeGuard<E, A extends E> = (error: E) => error is A;

/**
 * Matcher for Err values (returns any return type, e.g. string messages).
 *
 * - `.when(Ctor, handler)` matched via `instanceof`
 * - `.whenGuard(guard, handler)` matched via type guard
 * - `.run()` is only allowed once all error cases are handled (`E` is reduced to `never`)
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

    when<C extends Ctor<any>, R1>(
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): ErrorMatchBuilder<Exclude<E, InstanceType<C>>, R | R1> {
        if (this.#matched) return this as any;

        if (this.#error instanceof ctor) {
            return new ErrorMatchBuilder(this.#error, true, handler(this.#error as InstanceType<C>)) as any;
        }

        return this as any;
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

    otherwise<R2>(handler: (error: any) => R2): R | R2 {
        if (this.#matched) return this.#value as R;
        return handler(this.#error);
    }

    run(this: ErrorMatchBuilder<never, R>): R {
        if (this.#matched) return this.#value as R;
        throw this.#error;
    }
}

type OkOfReturn<R> = R extends Result<infer T, any> ? T : never;
type ErrOfReturn<R> = R extends Result<any, infer E> ? E : R;

type ErrFactory = <E>(error: E) => Result<never, E>;

/**
 * Matcher for `Result` errors that always returns a `Result`.
 *
 * Handlers may:
 * - return a `Result` (returned directly)
 * - return an error value (automatically wrapped to `Err(error)`)
 */
export class ErrMatchBuilder<T, E, OutT, OutE> {
    readonly #makeErr: ErrFactory;
    readonly #error: unknown;
    // Note: `any` is required here due to Result's invariance from type predicates
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
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    when<C extends Ctor<any>, R1>(
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): ErrMatchBuilder<T, Exclude<E, InstanceType<C>>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>> {
        if (this.#resolved) {
            // Already matched - just update the type
            return this as any;
        }

        if (this.#error instanceof ctor) {
            const out = handler(this.#error as InstanceType<C>);
            const resolved = isResult(out) ? out : this.#makeErr(out as ErrOfReturn<R1>);
            // Cast needed: Result is invariant due to type predicates, but we know this is safe
            return new ErrMatchBuilder(this.#makeErr, this.#error, resolved as any) as any;
        }

        // Not matched yet - continue with narrowed type
        return this as any;
    }

    whenGuard<A extends E, R1>(
        guard: TypeGuard<E, A>,
        handler: (error: A) => R1
    ): ErrMatchBuilder<T, Exclude<E, A>, OutT | OkOfReturn<R1>, OutE | ErrOfReturn<R1>> {
        if (this.#resolved) return this as any;

        const error = this.#error as E;
        if (guard(error)) {
            const out = handler(error);
            const resolved = isResult(out) ? out : this.#makeErr(out as ErrOfReturn<R1>);
            // Cast needed: Result is invariant due to type predicates, but we know this is safe
            return new ErrMatchBuilder(this.#makeErr, this.#error, resolved as any) as unknown as ErrMatchBuilder<
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

type ErrCase =
    | { readonly kind: 'ctor'; readonly ctor: Ctor<any>; readonly handler: (error: any) => unknown }
    | { readonly kind: 'val'; readonly value: unknown; readonly handler: (error: any) => unknown };

declare const HAS_OK: unique symbol;
type HasOk = { readonly [HAS_OK]: true };
type WithOk<T, E, R> = ResultMatchBuilder<T, E, R> & HasOk;

type IsUnion<T, U = T> = T extends any ? ([U] extends [T] ? false : true) : never;

type ExcludeIfLiteral<E, V> =
    IsUnion<V> extends true
    ? E
    : V extends string
    ? string extends V
    ? E
    : Exclude<E, V>
    : V extends number
    ? number extends V
    ? E
    : Exclude<E, V>
    : V extends boolean
    ? boolean extends V
    ? E
    : Exclude<E, V>
    : V extends bigint
    ? bigint extends V
    ? E
    : Exclude<E, V>
    : V extends symbol
    ? symbol extends V
    ? E
    : Exclude<E, V>
    : Exclude<E, V>;

/**
 * Universal matcher for `Result` (Ok + Err in a single chain).
 *
 * - `.err(Ctor, handler)` matched via `instanceof`
 * - `.errVal(value, handler)` matched via `Object.is`
 * - `.ok(handler)` defines the success branch
 * - `.run()` is only allowed after `.ok()` is set
 *
 * Lazy: if the Result is `Ok`, Err cases are not evaluated in `.run()`.
 */
export class ResultMatchBuilder<T, E, R> {
    readonly #result: Result<T, E>;
    readonly #errCases: readonly ErrCase[];
    readonly #okHandler: ((value: T) => unknown) | undefined;

    constructor(result: Result<T, E>, errCases: readonly ErrCase[] = [], okHandler?: (value: T) => unknown) {
        this.#result = result;
        this.#errCases = Object.freeze([...errCases]);
        this.#okHandler = okHandler;
        Object.freeze(this);
    }

    static fromResult<T, E>(result: Result<T, E>): ResultMatchBuilder<T, E, never> {
        return new ResultMatchBuilder(result);
    }

    err<C extends Ctor<any>, R1>(
        this: ResultMatchBuilder<T, E, R>,
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): ResultMatchBuilder<T, Exclude<E, InstanceType<C>>, R | R1>;
    err<C extends Ctor<any>, R1>(
        this: WithOk<T, E, R>,
        ctor: C,
        handler: (error: InstanceType<C>) => R1
    ): WithOk<T, Exclude<E, InstanceType<C>>, R | R1>;
    err<C extends Ctor<any>, R1>(ctor: C, handler: (error: InstanceType<C>) => R1): unknown {
        const next = new ResultMatchBuilder(
            this.#result as unknown as Result<T, Exclude<E, InstanceType<C>>>,
            [...this.#errCases, { kind: 'ctor', ctor, handler } satisfies ErrCase],
            this.#okHandler
        );
        return next as unknown;
    }

    errVal<const V, R1>(
        this: ResultMatchBuilder<T, E, R>,
        value: V,
        handler: (error: V) => R1
    ): ResultMatchBuilder<T, ExcludeIfLiteral<E, V>, R | R1>;
    errVal<const V, R1>(
        this: WithOk<T, E, R>,
        value: V,
        handler: (error: V) => R1
    ): WithOk<T, ExcludeIfLiteral<E, V>, R | R1>;
    errVal<const V, R1>(value: V, handler: (error: V) => R1): unknown {
        const next = new ResultMatchBuilder(
            this.#result as unknown as Result<T, ExcludeIfLiteral<E, V>>,
            [...this.#errCases, { kind: 'val', value, handler } satisfies ErrCase],
            this.#okHandler
        );
        return next as unknown;
    }

    ok<R1>(handler: (value: T) => R1): WithOk<T, E, R | R1> {
        const next = new ResultMatchBuilder(this.#result, this.#errCases, handler);
        return next as unknown as WithOk<T, E, R | R1>;
    }

    run(this: WithOk<T, E, R>): R {
        const result = this.#result;

        if (result.isOk()) {
            const okHandler = this.#okHandler as ((value: T) => R) | undefined;
            if (!okHandler) throw new Error('ResultMatchBuilder.run() requires an ok() handler.');
            return okHandler(result.value);
        }

        if (result.isErr()) {
            const error = result.error as E;

            for (const c of this.#errCases) {
                if (c.kind === 'ctor') {
                    if ((error as any) instanceof c.ctor) return c.handler(error) as R;
                    continue;
                }
                if (Object.is(error, c.value)) return c.handler(error) as R;
            }

            throw error;
        }

        throw new Error('Unreachable: Result is neither Ok nor Err');
    }
}
