import type { Result } from './result';

/**
 * Fallback mit einer Funktion die ein Result zurückgibt.
 * Entspricht Rust `or_else`.
 */
export function orElse<T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>): Result<T, F> {
    if (result.isOk()) return result as unknown as Result<T, F>;
    if (result.isErr()) return fn(result.error);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
