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
 * hidden helper field of another type is ignored. An array does not compile,
 * unless a type such as `Record<number, Result<T, E>>` widens it first. An array
 * that arrives anyway throws, because its indices would sequence into an object.
 * Use `sequence` for a list.
 */
export function sequenceRecord<
    // The mapped half maps a tuple onto a tuple, so alone it admits an array.
    // The `length` of an array is a number, so the second half rejects it. A
    // record can still hold a Result under the key `length`. A conditional
    // parameter type would also reject an array, but it stays unresolved for a
    // generic record and rejects that too.
    const R extends { readonly [K in keyof R]: Result<any, any> } & { readonly length?: Result<any, any> }
>(
    record: R
): Result<{ [K in keyof R]: OkValueOf<R[K]> }, ErrValueOf<R[keyof R]>> {
    type Out = { [K in keyof R]: OkValueOf<R[K]> };
    type E = ErrValueOf<R[keyof R]>;

    // An array reaches this point through JavaScript, `any`, a cast, or a type
    // that widens it, such as `Record<number, Result<T, E>>`. It would
    // sequence into an object keyed by its indices, because `length` is a
    // non-enumerable non-Result and the rule below skips it. A list of Results
    // belongs to `sequence()`, so the mistake fails here and returns no wrong shape.
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
