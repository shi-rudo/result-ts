import type { Result } from './result';
import { ok, err } from './result';
import type { Awaitable } from './pipeable';
import { InvalidResultStateError } from '../errors';

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

    for (const input of inputs) {
        const pendingResult = typeof input === 'function' ? input() : input;
        let result: Result<any, any>;
        try {
            result = await pendingResult;
        } catch (error) {
            errors.push(errorMapper ? errorMapper(error) : (error as F));
            continue;
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
