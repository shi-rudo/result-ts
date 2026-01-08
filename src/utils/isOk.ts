import type { Result } from '../result';

/**
 * Checks whether a Result is Ok.
 * Pure function alternative to the instance method.
 */
export function isOk<T, E>(result: Result<T, E>): result is Result<T, E> & { readonly value: T; readonly error: undefined } {
    return result.isOk();
}
