import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

type CollectFirstOkAsyncInput = Promise<Result<any, any>> | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Parallel version of `collectFirstOkAsync`.
 *
 * - Starts all inputs immediately (Promises or Thunks).
 * - Returns the first `Ok` as soon as it is available.
 * - If no `Ok` is found, returns an `Err` with all error values (in input order).
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

    const started = inputs.map((input) =>
        typeof input === 'function' ? Promise.resolve().then(input) : input
    );

    const firstOk = new Promise<Result<OkValue, ErrValue[]>>((resolve) => {
        for (const promise of started) {
            promise
                .then((result) => {
                    if (result.isOk()) {
                        resolve(ok<OkValue, ErrValue[]>(result.value as OkValue));
                    }
                })
                .catch(() => {
                    // Ignored here; handled in allSettled below.
                });
        }
    });

    const allErrors = Promise.allSettled(started).then((settled) => {
        const errors: ErrValue[] = [];
        for (const entry of settled) {
            if (entry.status === 'fulfilled') {
                const result = entry.value;
                if (result.isErr()) {
                    errors.push(result.error as ErrValue);
                } else if (!result.isOk()) {
                    throw new InvalidResultStateError('collectFirstOkParallelAsync');
                }
            } else {
                errors.push(errorMapper ? errorMapper(entry.reason) : (entry.reason as F));
            }
        }
        return err<ErrValue[], OkValue>(errors);
    });

    return Promise.race([firstOk, allErrors]);
}
