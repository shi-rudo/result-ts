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
 * - Processes inputs strictly sequentially (like `for ... of` + `await`).
 * - Returns the first `Ok` and collects all errors if no `Ok` is found.
 */
export async function collectFirstOkAsync<const Inputs extends readonly CollectFirstOkAsyncInput[]>(
    inputs: Inputs
): Promise<Result<OkValueOfInput<Inputs[number]>, ErrValueOfInput<Inputs[number]>[]>> {
    const errors: Array<ErrValueOfInput<Inputs[number]>> = [];

    for (const input of inputs) {
        try {
            const result = await (typeof input === 'function' ? input() : input);
            if (result.isOk()) {
                return ok<OkValueOfInput<Inputs[number]>, ErrValueOfInput<Inputs[number]>[]>(
                    result.value as OkValueOfInput<Inputs[number]>
                );
            }
            if (result.isErr()) {
                errors.push(result.error as ErrValueOfInput<Inputs[number]>);
                continue;
            }
            throw new InvalidResultStateError('collectFirstOkAsync');
        } catch (error) {
            // If the Promise itself rejects, we treat it as an Error
            errors.push(error as ErrValueOfInput<Inputs[number]>);
        }
    }

    return err<ErrValueOfInput<Inputs[number]>[], OkValueOfInput<Inputs[number]>>(errors);
}
