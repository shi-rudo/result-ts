import type { Result } from './result';
import { ok, err } from './result';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Parse a set of `Result`s, short-circuits when an input value is `Ok`.
 * If no `Ok` is found, returns an `Err` containing the collected error values.
 * Useful for "try multiple approaches until one works" patterns.
 */
export function collectFirstOk<const Results extends readonly Result<any, any>[]>(
    results: Results
): Result<OkValueOf<Results[number]>, ErrValueOf<Results[number]>[]> {
    const errors: Array<ErrValueOf<Results[number]>> = [];

    for (const result of results) {
        if (result.isOk()) {
            return ok<OkValueOf<Results[number]>, ErrValueOf<Results[number]>[]>(
                result.value as OkValueOf<Results[number]>
            );
        }
        if (result.isErr()) {
            errors.push(result.error as ErrValueOf<Results[number]>);
            continue;
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return err<ErrValueOf<Results[number]>[], OkValueOf<Results[number]>>(errors);
}
