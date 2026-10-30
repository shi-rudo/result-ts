import type { Result } from './result';
import { ok, err } from './result';
import type { Awaitable } from './pipeable';
import { isResult } from './isResult';
import { InvalidResultStateError } from '../errors';
import { describeValue } from '../describeValue';

type CollectFirstOkAsyncInput =
    | Promise<Result<any, any>>
    | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Async version of collectFirstOk.
 *
 * - Takes either already started Promises or "Thunks" (`() => Awaitable<Result<...>>`).
 *   A thunk that throws synchronously is a programmer error: the call rejects
 *   with that exception.
 * - Processes inputs strictly sequentially (like `for ... of` + `await`).
 * - Returns the first `Ok` and collects all errors if no `Ok` is found.
 * - No rejection of a promise input becomes an unhandled rejection. A rejection
 *   that arrives before the call reaches its input counts when the call gets
 *   there. A rejection that arrives after the call ends is discarded. A thunk
 *   that the call did not reach never starts.
 * - A fulfilled value that is not a `Result` is a programmer error: the call
 *   rejects with `InvalidResultStateError`.
 * - A rejected input counts as a failed attempt. Without `errorMapper` the
 *   collected errors are `unknown[]`, because a rejection reason can be
 *   anything. `errorMapper` turns each rejection reason into a typed error;
 *   `Err` values pass through untouched, and bugs inside the mapper are rethrown.
 */
export function collectFirstOkAsync<const Inputs extends readonly CollectFirstOkAsyncInput[]>(
    inputs: Inputs
): Promise<Result<OkValueOfInput<Inputs[number]>, unknown[]>>;
export function collectFirstOkAsync<const Inputs extends readonly CollectFirstOkAsyncInput[], F>(
    inputs: Inputs,
    errorMapper: (error: unknown) => F
): Promise<Result<OkValueOfInput<Inputs[number]>, Array<ErrValueOfInput<Inputs[number]> | F>>>;
export async function collectFirstOkAsync<const Inputs extends readonly CollectFirstOkAsyncInput[], F>(
    inputs: Inputs,
    errorMapper?: (error: unknown) => F
): Promise<Result<OkValueOfInput<Inputs[number]>, Array<ErrValueOfInput<Inputs[number]> | F>>> {
    type OkValue = OkValueOfInput<Inputs[number]>;
    type ErrValue = ErrValueOfInput<Inputs[number]> | F;

    const errors: ErrValue[] = [];

    // The handler marks the rejection as handled, and the loop still sees it
    // when it awaits the input.
    for (const input of inputs) {
        if (isNativePromise(input)) input.catch(() => {});
    }

    for (const [index, input] of inputs.entries()) {
        const pendingResult = typeof input === 'function' ? input() : input;
        let result: unknown;
        try {
            result = await pendingResult;
        } catch (error) {
            errors.push(errorMapper ? errorMapper(error) : (error as F));
            continue;
        }

        if (!isResult(result)) {
            throw new InvalidResultStateError('collectFirstOkAsync', `input ${index} fulfilled with ${describeValue(result)}, not a Result`);
        }
        if (result.isOk()) {
            return ok<OkValue, ErrValue[]>(result.value as OkValue);
        }
        if (result.isErr()) {
            errors.push(result.error as ErrValue);
            continue;
        }
        throw new InvalidResultStateError('collectFirstOkAsync');
    }

    return err<ErrValue[], OkValue>(errors);
}

// Only a native promise reports an unhandled rejection. `instanceof Promise`
// misses one from another realm, so the check reads the brand that every
// native promise carries. A thenable gets no handler, because calling its
// `then` would start a lazy one.
const isNativePromise = (value: unknown): value is Promise<unknown> =>
    Object.prototype.toString.call(value) === '[object Promise]';
