import type { Result } from './result';
import { err, ok } from './result';
import { isResult } from './utils/isResult';

type AnyGenerator = Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>;

type YieldOf<G> = G extends Generator<infer Y, any, any>
    ? Y
    : G extends AsyncGenerator<infer Y, any, any>
    ? Y
    : never;

type ReturnOf<G> = G extends Generator<any, infer R, any>
    ? R
    : G extends AsyncGenerator<any, infer R, any>
    ? R
    : never;

type ErrorOfYield<Y> = Y extends Result<any, infer E> ? E : never;

type ErrorOfGenerator<G> = ErrorOfYield<YieldOf<G>>;

type OnThrow<E> = (error: unknown) => E;

type AwaitedReturnOf<G> = Awaited<ReturnOf<G>>;
type OkOfReturn<G> = AwaitedReturnOf<G> extends Result<infer T, any> ? T : AwaitedReturnOf<G>;
type ErrOfReturn<G> = AwaitedReturnOf<G> extends Result<any, infer E> ? E : never;

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
export async function task<const G extends AnyGenerator>(
    makeGenerator: () => G
): Promise<Result<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G>>>;
export async function task<const G extends AnyGenerator, EThrown>(
    makeGenerator: () => G,
    onThrow: OnThrow<EThrown>
): Promise<Result<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown>>;
export async function task<const G extends AnyGenerator, EThrown>(
    makeGenerator: () => G,
    onThrow?: OnThrow<EThrown>
): Promise<Result<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown>> {
    const iterator = makeGenerator();
    let input: unknown = undefined;

    while (true) {
        let step: IteratorResult<Result<any, any>, any>;
        try {
            step = await (iterator as any).next(input);
        } catch (caught) {
            if (!onThrow) throw caught;
            return err<ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown, OkOfReturn<G>>(onThrow(caught));
        }

        if (step.done) {
            try {
                const awaited = await (step.value as any);
                if (isResult(awaited)) {
                    return awaited as Result<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown>;
                }
                return ok<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown>(awaited);
            } catch (caught) {
                if (!onThrow) throw caught;
                return err<ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown, OkOfReturn<G>>(onThrow(caught));
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
                if (typeof (iterator as any).return === 'function') {
                    await (iterator as any).return(undefined);
                }
            } catch (caught) {
                if (!onThrow) throw caught;
                return err<ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown, OkOfReturn<G>>(onThrow(caught));
            }

            return yielded as Result<OkOfReturn<G>, ErrorOfGenerator<G> | ErrOfReturn<G> | EThrown>;
        }

        throw new Error('Unreachable: Result is neither Ok nor Err');
    }
}

export const gen = task;
