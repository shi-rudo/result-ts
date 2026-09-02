import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { err, ok } from './result';
import { isResult } from './isResult';
import { InvalidResultStateError } from '../errors';

type CollectFirstOkAsyncInput = Promise<Result<any, any>> | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Parallel version of `collectFirstOkAsync`.
 *
 * - Starts all inputs immediately (Promises or Thunks). A thunk that throws
 *   synchronously is a programmer error: the call rejects with that exception,
 *   as `collectFirstOkAsync` does.
 * - Returns the first `Ok` as soon as it is available.
 * - If no `Ok` is found, returns an `Err` with all error values (in input order).
 * - A fulfilled value that is not a `Result` is a programmer error: the call
 *   rejects with `InvalidResultStateError`, unless an `Ok` already won the race.
 * - A rejected input counts as a failed attempt. Without `errorMapper` the
 *   collected errors are `unknown[]`, because a rejection reason can be
 *   anything. `errorMapper` turns each rejection reason into a typed error;
 *   `Err` values pass through untouched, and bugs inside the mapper are rethrown.
 * - If multiple inputs provide an `Ok`, the one that completes first wins.
 *   In case of simultaneous completion, the first observed result wins.
 * - If no `Ok` arrives and at least one input never settles, the Promise remains pending.
 */
export function collectFirstOkParallelAsync<const Inputs extends readonly CollectFirstOkAsyncInput[]>(
    inputs: Inputs
): Promise<Result<OkValueOfInput<Inputs[number]>, unknown[]>>;
export function collectFirstOkParallelAsync<const Inputs extends readonly CollectFirstOkAsyncInput[], F>(
    inputs: Inputs,
    errorMapper: (error: unknown) => F
): Promise<Result<OkValueOfInput<Inputs[number]>, Array<ErrValueOfInput<Inputs[number]> | F>>>;
export async function collectFirstOkParallelAsync<const Inputs extends readonly CollectFirstOkAsyncInput[], F>(
    inputs: Inputs,
    errorMapper?: (error: unknown) => F
): Promise<Result<OkValueOfInput<Inputs[number]>, Array<ErrValueOfInput<Inputs[number]> | F>>> {
    type OkValue = OkValueOfInput<Inputs[number]>;
    type ErrValue = ErrValueOfInput<Inputs[number]> | F;

    if (inputs.length === 0) {
        return err<ErrValue[], OkValue>([]);
    }

    // Discarding the outcomes of the attempts that already started keeps an
    // abandoned rejection from surfacing as an unhandled rejection.
    const started: Promise<unknown>[] = [];
    try {
        for (const input of inputs) {
            started.push(typeof input === 'function' ? Promise.resolve(input()) : input);
        }
    } catch (bug) {
        for (const promise of started) promise.catch(() => {});
        throw bug;
    }

    const firstOk = new Promise<Result<OkValue, ErrValue[]>>((resolve, reject) => {
        for (const promise of started) {
            promise.then(
                (value) => {
                    if (!isResult(value)) {
                        reject(new InvalidResultStateError('collectFirstOkParallelAsync'));
                    } else if (value.isOk()) {
                        resolve(ok<OkValue, ErrValue[]>(value.value as OkValue));
                    }
                },
                () => {
                    // A rejection is a failed attempt; allSettled below collects it.
                }
            );
        }
    });

    const allErrors = Promise.allSettled(started).then((settled) => {
        const errors: ErrValue[] = [];
        for (const entry of settled) {
            if (entry.status === 'rejected') {
                errors.push(errorMapper ? errorMapper(entry.reason) : (entry.reason as F));
                continue;
            }
            const result = entry.value;
            if (isResult(result)) {
                if (result.isErr()) {
                    errors.push(result.error as ErrValue);
                    continue;
                }
                if (result.isOk()) continue;
            }
            throw new InvalidResultStateError('collectFirstOkParallelAsync');
        }
        return err<ErrValue[], OkValue>(errors);
    });

    return Promise.race([firstOk, allErrors]);
}
