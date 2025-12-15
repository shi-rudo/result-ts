import type { Result } from './result';
import { ok, err } from './result';

/**
 * Kombiniert eine Liste von Results.
 * Gibt Ok(values) nur zurück wenn alle Ok sind, sonst Err([errors]).
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
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return errors.length === 0 ? ok(values) : err<E[], T[]>(errors);
}
