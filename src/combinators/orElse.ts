import type { Result } from '../result';

/**
 * Fallback using a function that returns a Result.
 * Equivalent to Rust `or_else`.
 */
export function orElse<T, E, T2 = T, E2 = E>(
    result: Result<T, E>,
    fn: (error: E) => Result<T2, E2>
): Result<T | T2, E2> {
    if (result.isOk()) return result as unknown as Result<T | T2, E2>;
    if (result.isErr()) return fn(result.error) as unknown as Result<T | T2, E2>;
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
