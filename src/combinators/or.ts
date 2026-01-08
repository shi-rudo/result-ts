import type { Result } from '../result';

/**
 * Fallback to another Result when the first is Err.
 * Equivalent to Rust `or`.
 */
export function or<T, E, T2 = T, E2 = E>(result: Result<T, E>, other: Result<T2, E2>): Result<T | T2, E2> {
    return result.isOk() ? (result as unknown as Result<T | T2, E2>) : (other as unknown as Result<T | T2, E2>);
}
