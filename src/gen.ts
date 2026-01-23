import type { Result } from './core/result';
import { err, ok } from './core/result';
import { isResult } from './core/isResult';

type AnyGenerator<Y = unknown, R = unknown, N = unknown> = Generator<Y, R, N> | AsyncGenerator<Y, R, N>;

type ErrorOfYield<Y> = Y extends Result<any, infer E> ? E : never;

type OnThrow<E> = (error: unknown) => E;

type AwaitedReturn<R> = Awaited<R>;
type OkOfReturn<R> = AwaitedReturn<R> extends Result<infer T, any> ? T : AwaitedReturn<R>;
type ErrOfReturn<R> = AwaitedReturn<R> extends Result<any, infer E> ? E : never;

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
    const iterator = makeGenerator();
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
                if (isResult(awaited)) {
                    return awaited as Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>;
                }
                return ok<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>(awaited as OkOfReturn<R>);
            } catch (caught) {
                if (!onThrow) throw caught;
                return err<ErrorOfYield<Y> | ErrOfReturn<R> | EThrown, OkOfReturn<R>>(onThrow(caught));
            }
        }

        const yielded = step.value as unknown;
        if (!isResult(yielded)) {
            throw new TypeError('task() expected yielded values to be Result. Use `yield*` on a Result.');
        }

        if (yielded.isOk()) {
            input = yielded.value;
            continue;
        }

        if (yielded.isErr()) {
            try {
                if (typeof iterator.return === 'function') {
                    await iterator.return(undefined as unknown as R);
                }
            } catch (caught) {
                if (!onThrow) throw caught;
                return err<ErrorOfYield<Y> | ErrOfReturn<R> | EThrown, OkOfReturn<R>>(onThrow(caught));
            }

            return yielded as Result<OkOfReturn<R>, ErrorOfYield<Y> | ErrOfReturn<R> | EThrown>;
        }

        throw new Error('Unreachable: Result is neither Ok nor Err');
    }
}

export const gen = task;
