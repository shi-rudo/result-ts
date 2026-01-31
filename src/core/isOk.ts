import type { Ok, Result } from './result';

/**
 * Checks if a Result is Ok.
 * Pure function alternative to the instance method.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
    return result.isOk();
}
