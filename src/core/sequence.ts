import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;
type SequenceValues<Results extends readonly Result<any, any>[]> = {
    -readonly [K in keyof Results]: OkValueOf<Results[K]>;
};

/**
 * Combines a list of Results into a single Result of a list.
 * Short-circuits on the first Err.
 * Analogous to Rust `collect::<Result<Vec<_>, _>>()`.
 */
export function sequence<const Results extends readonly Result<any, any>[]>(
    results: Results
): Result<SequenceValues<Results>, ErrValueOf<Results[number]>> {
    const values: Array<OkValueOf<Results[number]>> = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value as OkValueOf<Results[number]>);
            continue;
        }
        if (result.isErr()) return result as unknown as Result<SequenceValues<Results>, ErrValueOf<Results[number]>>;
        throw new InvalidResultStateError('sequence');
    }

    return ok<SequenceValues<Results>, ErrValueOf<Results[number]>>(values as SequenceValues<Results>);
}

/**
 * Alias for `sequence`.
 */
export function all<const Results extends readonly Result<any, any>[]>(
    results: Results
): Result<SequenceValues<Results>, ErrValueOf<Results[number]>> {
    return sequence(results);
}
