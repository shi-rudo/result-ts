import type { Result } from './result';

/**
 * Checks if the Result contains a specific error.
 * Analogous to `contains` for the Err case.
 */
export function containsErr<T, E>(result: Result<T, E>, error: E): boolean {
    if (!result.isErr()) return false;
    return result.error === error;
}
