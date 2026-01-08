import type { Result } from '../result';
import { ok, err } from '../result';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Combines a list of Results.
 * Returns Ok(values) only if all are Ok, otherwise Err([errors]).
 */
export function collectAllErrors<const Results extends readonly Result<any, any>[]>(
    results: Results
): Result<Array<OkValueOf<Results[number]>>, Array<ErrValueOf<Results[number]>>> {
    const values: Array<OkValueOf<Results[number]>> = [];
    const errors: Array<ErrValueOf<Results[number]>> = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value as OkValueOf<Results[number]>);
            continue;
        }
        if (result.isErr()) {
            errors.push(result.error as ErrValueOf<Results[number]>);
            continue;
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return errors.length === 0
        ? ok(values)
        : err<Array<ErrValueOf<Results[number]>>, Array<OkValueOf<Results[number]>>>(errors);
}
