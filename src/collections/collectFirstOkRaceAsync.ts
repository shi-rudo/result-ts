import type { Awaitable } from '../pipeable';
import type { Result } from '../result';
import { err, ok } from '../result';

type CollectFirstOkAsyncInput = Promise<Result<any, any>> | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Parallel/race variant of `collectFirstOkAsync`.
 *
 * - Starts all inputs immediately (promises or thunks).
 * - Returns the first `Ok` as soon as it is available.
 * - If no `Ok` is found, returns an `Err` with all error values (in input order).
 * - **Note**: There is no cancellation logic. All inputs keep running even after the first `Ok` is found.
 */
export async function collectFirstOkRaceAsync<const Inputs extends readonly CollectFirstOkAsyncInput[]>(
    inputs: Inputs
): Promise<Result<OkValueOfInput<Inputs[number]>, ErrValueOfInput<Inputs[number]>[]>> {
    type OkValue = OkValueOfInput<Inputs[number]>;
    type ErrValue = ErrValueOfInput<Inputs[number]>;

    if (inputs.length === 0) {
        return err<ErrValue[], OkValue>([]);
    }

    const UNSET = Symbol('unset');
    const errorsByIndex: Array<ErrValue | typeof UNSET> = Array(inputs.length).fill(UNSET);

    return new Promise<Result<OkValue, ErrValue[]>>((resolve) => {
        let done = false;
        let remaining = inputs.length;

        const finishAllErr = () => {
            const errors: ErrValue[] = [];
            for (const entry of errorsByIndex) {
                if (entry !== UNSET) errors.push(entry);
            }
            resolve(err<ErrValue[], OkValue>(errors));
        };

        const settleError = (index: number, errorValue: ErrValue) => {
            if (done) return;
            errorsByIndex[index] = errorValue;
            remaining -= 1;
            if (remaining === 0) {
                done = true;
                finishAllErr();
            }
        };

        inputs.forEach((input, index) => {
            Promise.resolve()
                .then(() => (typeof input === 'function' ? input() : input))
                .then((result) => {
                    if (done) return;
                    if (result.isOk()) {
                        done = true;
                        resolve(ok<OkValue, ErrValue[]>(result.value as OkValue));
                        return;
                    }
                    if (result.isErr()) {
                        settleError(index, result.error as ErrValue);
                        return;
                    }
                    settleError(index, new Error('Unreachable: Result is neither Ok nor Err') as ErrValue);
                })
                .catch((caught) => {
                    settleError(index, caught as ErrValue);
                });
        });
    });
}
