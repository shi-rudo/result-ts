import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';
import { isResult } from './isResult';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Like `sequence`, but for Records/Objects.
 * Short-circuits on the first Err.
 *
 * A non-enumerable own property is an input only when it holds a `Result`, so a
 * hidden helper field of another type is ignored. An array throws, because its
 * indices would sequence into an object; use `sequence` for a list.
 */
export function sequenceRecord<const R extends { readonly [K in keyof R]: Result<any, any> }>(
    record: R
): Result<{ [K in keyof R]: OkValueOf<R[K]> }, ErrValueOf<R[keyof R]>> {
    type Out = { [K in keyof R]: OkValueOf<R[K]> };
    type E = ErrValueOf<R[keyof R]>;

    // An array reaches this point only from JavaScript, and it would sequence
    // into an object keyed by its indices: `length` is a non-enumerable
    // non-Result and the rule below would skip it. A list of Results belongs to
    // `sequence()`, so the mistake fails here instead of returning a wrong shape.
    if (Array.isArray(record)) throw new InvalidResultStateError('sequenceRecord');

    const out: Partial<Out> = {};

    // `Reflect.ownKeys` keeps the symbol keys, which the signature supports, and
    // it also visits the non-enumerable properties. `keyof R` sees those too, so
    // a hidden Result stays an input. A hidden value of another type is a helper
    // field that the caller attached, and it is skipped instead of rejected.
    for (const key of Reflect.ownKeys(record) as Array<keyof R>) {
        const result = record[key];

        if (!isResult(result)) {
            if (!Object.getOwnPropertyDescriptor(record, key)?.enumerable) continue;
            throw new InvalidResultStateError('sequenceRecord');
        }

        if (result.isOk()) {
            out[key] = result.value as Out[typeof key];
            continue;
        }
        if (result.isErr()) return result as unknown as Result<Out, E>;
        throw new InvalidResultStateError('sequenceRecord');
    }

    return ok<Out, E>(out as Out);
}
