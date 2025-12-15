import type { Result } from './result';
import { ok } from './result';

/**
 * Kombiniert eine Liste von Results zu einem Result einer Liste.
 * Short-circuits beim ersten Err.
 * Analog zu Rust `collect::<Result<Vec<_>, _>>()`.
 */
export function sequence<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];

    for (const result of results) {
        if (result.isOk()) {
            values.push(result.value);
            continue;
        }
        if (result.isErr()) return result as unknown as Result<T[], E>;
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return ok(values);
}

/**
 * Alias für `sequence`.
 */
export function all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
    return sequence(results);
}
