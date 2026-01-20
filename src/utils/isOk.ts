import type { Ok, Result } from '../result';

/**
 * Checks whether a Result is Ok.
 * Pure function alternative to the instance method.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, never> {
    return result.isOk();
}
