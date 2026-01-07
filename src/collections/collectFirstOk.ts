import type { Result } from '../result';
import { ok, err } from '../result';

/**
 * Parse a set of `Result`s, short-circuits when an input value is `Ok`.
 * If no `Ok` is found, returns an `Err` containing the collected error values.
 * Useful for "try multiple approaches until one works" patterns.
 */
export function collectFirstOk<T, E>(
    results: readonly (Result<T, E> | Result<T, never> | Result<never, E>)[]
): Result<T, E[]> {
    const errors: E[] = [];

    for (const result of results) {
        if (result.isOk()) {
            return ok<T, E[]>(result.value);
        }
        if (result.isErr()) {
            errors.push(result.error);
            continue;
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return err<E[], T>(errors);
}
