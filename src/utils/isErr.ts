import type { Result } from '../result';

/**
 * Checks whether a Result is Err.
 * Pure function alternative to the instance method.
 */
export function isErr<T, E>(result: Result<T, E>): result is Result<T, E> & { readonly value: undefined; readonly error: E } {
    return result.isErr();
}
