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
 * Combines a list of Results into a Result of a list.
 * Short-circuits on the first Err.
 * Analogous to Rust `collect::<Result<Vec<_>, _>>()`.
 */
export function sequence<const Results extends readonly ResultLike<any, any>[]>(
    results: Results
): Result<Array<OkValueOf<Results[number]>>, ErrValueOf<Results[number]>> {
    const values: Array<OkValueOf<Results[number]>> = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value as OkValueOf<Results[number]>);
            continue;
        }
        if (result.isErr()) {
            return result as unknown as Result<Array<OkValueOf<Results[number]>>, ErrValueOf<Results[number]>>;
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return ok<Array<OkValueOf<Results[number]>>, ErrValueOf<Results[number]>>(values);
}

/**
 * Alias for `sequence`.
 */
export function all<const Results extends readonly ResultLike<any, any>[]>(
    results: Results
): Result<Array<OkValueOf<Results[number]>>, ErrValueOf<Results[number]>> {
    return sequence(results);
}
