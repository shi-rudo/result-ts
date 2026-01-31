import type { Err, Result } from './result';

/**
 * Checks if a Result is Err.
 * Pure function alternative to the instance method.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
    return result.isErr();
}
