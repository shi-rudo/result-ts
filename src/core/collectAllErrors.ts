import type { Result } from './result';
import { ok, err } from './result';
import { InvalidResultStateError } from '../errors';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;
type CollectionValues<Results extends readonly Result<any, any>[]> = {
    -readonly [K in keyof Results]: OkValueOf<Results[K]>;
};

/**
 * Combines a list of Results.
 * Return Ok(values) only if all are Ok, otherwise Err([errors]).
 */
export function collectAllErrors<const Results extends readonly Result<any, any>[]>(
    results: Results
): Result<CollectionValues<Results>, Array<ErrValueOf<Results[number]>>> {
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
        throw new InvalidResultStateError('collectAllErrors');
    }

    return errors.length === 0
        ? ok<CollectionValues<Results>, Array<ErrValueOf<Results[number]>>>(values as CollectionValues<Results>)
        : err<Array<ErrValueOf<Results[number]>>, CollectionValues<Results>>(errors);
}
