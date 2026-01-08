import type { Result } from '../result';

/**
 * Combines two Results. Returns the second only if the first is Ok.
 * Equivalent to Rust `and`.
 */
export function and<T, E, U>(result: Result<T, E>, other: Result<U, E>): Result<U, E> {
    return result.isOk() ? other : result as unknown as Result<U, E>;
}
