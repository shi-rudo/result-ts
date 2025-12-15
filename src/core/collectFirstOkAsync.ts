import type { Result } from './result';
import { ok, err } from './result';
import type { Awaitable } from './pipeable';

type CollectFirstOkAsyncInput =
    | Promise<Result<any, any>>
    | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Async-Version von collectFirstOk.
 *
 * - Nimmt entweder bereits gestartete Promises oder "Thunks" (`() => Awaitable<Result<...>>`).
 * - Verarbeitet die Inputs strikt sequentiell (wie `for ... of` + `await`).
 * - Gibt das erste `Ok` zurück und sammelt alle Errors wenn kein `Ok` gefunden wird.
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
            throw new Error('Unreachable: Result is neither Ok nor Err');
        } catch (error) {
            // Wenn das Promise selbst rejected, behandeln wir es als Error
            errors.push(error as ErrValueOfInput<Inputs[number]>);
        }
    }

    return err<ErrValueOfInput<Inputs[number]>[], OkValueOfInput<Inputs[number]>>(errors);
}
