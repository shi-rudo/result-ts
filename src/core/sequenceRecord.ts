import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Like `sequence`, but for Records/Objects.
 * Short-circuits on the first Err.
 */
export function sequenceRecord<const R extends Record<string, Result<any, any>>>(
    record: R
): Result<{ [K in keyof R]: OkValueOf<R[K]> }, ErrValueOf<R[keyof R]>> {
    type Out = { [K in keyof R]: OkValueOf<R[K]> };
    type E = ErrValueOf<R[keyof R]>;

    const out: Partial<Out> = {};

    for (const key of Object.keys(record) as Array<keyof R>) {
        const result = record[key];
        if (!result) continue;
        if (result.isOk()) {
            out[key] = result.value as Out[typeof key];
            continue;
        }
        if (result.isErr()) return result as unknown as Result<Out, E>;
        throw new InvalidResultStateError('sequenceRecord');
    }

    return ok<Out, E>(out as Out);
}
