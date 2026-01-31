import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Combines a list of Results into a single Result of a list.
 * Short-circuits on the first Err.
 * Analogous to Rust `collect::<Result<Vec<_>, _>>()`.
 */
export function sequence<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value);
            continue;
        }
        if (result.isErr()) return result as unknown as Result<T[], E>;
        throw new InvalidResultStateError('sequence');
    }

    return ok(values);
}

/**
 * Alias for `sequence`.
 */
export function all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
    return sequence(results);
}
