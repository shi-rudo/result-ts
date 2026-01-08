import type { Result } from '../result';

/**
 * Returns the value or computes a default value with a function.
 * Equivalent to Rust `unwrap_or_else`.
 */
export function unwrapOrElse<T, E, D = T>(result: Result<T, E>, fn: (error: E) => D): T | D {
    if (result.isOk()) return result.value;
    if (result.isErr()) return fn(result.error);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
