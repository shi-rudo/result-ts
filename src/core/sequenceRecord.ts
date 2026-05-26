import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';
import { isResult } from './isResult';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Like `sequence`, but for Records/Objects.
 * Short-circuits on the first Err.
 */
export function sequenceRecord<const R extends { readonly [K in keyof R]: Result<any, any> }>(
    record: R
): Result<{ [K in keyof R]: OkValueOf<R[K]> }, ErrValueOf<R[keyof R]>> {
    type Out = { [K in keyof R]: OkValueOf<R[K]> };
    type E = ErrValueOf<R[keyof R]>;

    const out: Partial<Out> = {};

    for (const key of Reflect.ownKeys(record) as Array<keyof R>) {
        const result = record[key];
        if (!isResult(result)) throw new InvalidResultStateError('sequenceRecord');
        if (result.isOk()) {
            out[key] = result.value as Out[typeof key];
            continue;
        }
        if (result.isErr()) return result as unknown as Result<Out, E>;
        throw new InvalidResultStateError('sequenceRecord');
    }

    return ok<Out, E>(out as Out);
}
