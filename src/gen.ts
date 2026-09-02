import type { Result } from './core/result';
import { err, ok } from './core/result';
import { isResult } from './core/isResult';
import { InvalidResultStateError, TaskYieldNotResultError } from './errors';

type AnyGenerator<Y = unknown, R = unknown, N = unknown> = Generator<Y, R, N> | AsyncGenerator<Y, R, N>;

type ErrorOfYield<Y> = Y extends Result<any, infer E> ? E : never;

type OnThrow<E> = (error: unknown) => E;

type AwaitedReturn<R> = Awaited<R>;
type OkOfReturn<R> = AwaitedReturn<R> extends Result<infer T, any> ? T : AwaitedReturn<R>;
type ErrOfReturn<R> = AwaitedReturn<R> extends Result<any, infer E> ? E : never;

/**
 * What the runner does with a yielded value: resume the generator with the
 * Ok value, or end the workflow with a Result or with a programmer error.
 */
type Decision<T, E> =
    | { readonly kind: 'continue'; readonly input: unknown }
    | { readonly kind: 'return'; readonly result: Result<T, E> }
    | { readonly kind: 'throw'; readonly error: unknown };

type Completion<T, E> = Exclude<Decision<T, E>, { kind: 'continue' }>;

/**
 * Generator-based do-notation for `Result`.
 *
 * Usage:
 * ```ts
 * const out = await task(async function* () {
 *   const user = yield* await fromPromise(findUser(1));
 *   const email = yield* validate(user.email);
 *   return email;
 * });
 * ```
 */
export async function task<const Y, const R>(
    makeGenerator: () => AnyGenerator<Y, R, unknown>
): Promise<Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R>>>;
export async function task<const Y, const R, EThrown>(
    makeGenerator: () => AnyGenerator<Y, R, unknown>,
    onThrow: OnThrow<EThrown>
): Promise<Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>>;
export async function task<const Y, const R, EThrown>(
    makeGenerator: () => AnyGenerator<Y, R, unknown>,
    onThrow?: OnThrow<EThrown>
): Promise<Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>> {
    type Out = Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>;

    const iterator = makeGenerator();

    const decide = (yielded: unknown): Decision<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown> => {
        if (!isResult(yielded)) return { kind: 'throw', error: new TaskYieldNotResultError(yielded) };
        if (yielded.isOk()) return { kind: 'continue', input: yielded.value };
        if (yielded.isErr()) return { kind: 'return', result: yielded as Out };
        return { kind: 'throw', error: new InvalidResultStateError('task') };
    };

    // Resume the suspended generator as if it returned, so its `finally`
    // blocks run before the workflow ends. Those blocks follow the same
    // yield protocol as the body: an Ok sends its value back, and an Err or
    // a non-Result replaces the pending completion and skips the rest of
    // that block, exactly like a `throw` inside `finally` replaces a pending
    // exception. Outer `finally` blocks still run.
    const abandon = async (
        pending: Completion<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>
    ): Promise<Completion<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>> => {
        if (typeof iterator.return !== 'function') return pending;
        let completion = pending;
        let step = await iterator.return(undefined as unknown as R);
        while (!step.done) {
            const decision = decide(step.value);
            if (decision.kind === 'continue') {
                step = await iterator.next(decision.input);
                continue;
            }
            completion = decision;
            step = await iterator.return(undefined as unknown as R);
        }
        return completion;
    };

    let input: unknown = undefined;

    while (true) {
        let step: IteratorResult<Y, R>;
        try {
            step = await iterator.next(input);
        } catch (caught) {
            if (!onThrow) throw caught;
            return err<ErrorOfYield<Y> | ErrOfReturn<R> | EThrown, OkOfReturn<R>>(onThrow(caught));
        }

        if (step.done) {
            try {
                const awaited = await step.value;
                if (isResult(awaited)) return awaited as Out;
                return ok<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>(awaited as OkOfReturn<R>);
            } catch (caught) {
                if (!onThrow) throw caught;
                return err<ErrorOfYield<Y> | ErrOfReturn<R> | EThrown, OkOfReturn<R>>(onThrow(caught));
            }
        }

        const decision = decide(step.value);
        if (decision.kind === 'continue') {
            input = decision.input;
            continue;
        }

        let completion: Completion<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>;
        try {
            completion = await abandon(decision);
        } catch (caught) {
            if (!onThrow) throw caught;
            return err<ErrorOfYield<Y> | ErrOfReturn<R> | EThrown, OkOfReturn<R>>(onThrow(caught));
        }
        if (completion.kind === 'throw') throw completion.error;
        return completion.result;
    }
}

export const gen: typeof task = task;
