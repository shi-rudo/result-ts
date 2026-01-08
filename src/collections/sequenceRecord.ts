import type { Result } from '../result';
import { ok } from '../result';

type ResultLike<T, E> = {
    isOk(): boolean;
    isErr(): boolean;
    readonly value: T | undefined;
    readonly error: E | undefined;
};

type OkValueOf<R> = R extends ResultLike<infer T, any> ? T : never;
type ErrValueOf<R> = R extends ResultLike<any, infer E> ? E : never;

/**
 * Like `sequence`, but for records/objects.
 * Short-circuits on the first Err.
 */
export function sequenceRecord<const R extends Record<string, ResultLike<any, any>>>(
    record: R
): Result<{ [K in keyof R]: OkValueOf<R[K]> }, ErrValueOf<R[keyof R]>> {
    type Out = { [K in keyof R]: OkValueOf<R[K]> };
    type E = ErrValueOf<R[keyof R]>;

    const out: Partial<Out> = {};

    for (const key of Object.keys(record) as Array<keyof R>) {
        const result = record[key];
        if (!result) {
            throw new Error(`Missing Result for key "${String(key)}"`);
        }
        if (result.isOk()) {
            out[key] = result.value as Out[typeof key];
            continue;
        }
        if (result.isErr()) return result as unknown as Result<Out, E>;
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return ok<Out, E>(out as Out);
}
