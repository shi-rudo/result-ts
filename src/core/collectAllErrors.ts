import type { Result } from './result';
import { ok, err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Combines a list of Results.
 * Return Ok(values) only if all are Ok, otherwise Err([errors]).
 */
export function collectAllErrors<T, E>(results: readonly Result<T, E>[]): Result<T[], E[]> {
    const values: T[] = [];
    const errors: E[] = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value);
            continue;
        }
        if (result.isErr()) {
            errors.push(result.error);
            continue;
        }
        throw new InvalidResultStateError('collectAllErrors');
    }

    return errors.length === 0 ? ok(values) : err<E[], T[]>(errors);
}
