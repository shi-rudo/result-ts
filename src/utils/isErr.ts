import type { Err, Result } from '../result';

/**
 * Checks whether a Result is Err.
 * Pure function alternative to the instance method.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<never, E> {
    return result.isErr();
}
