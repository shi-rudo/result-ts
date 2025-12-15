import type { Result } from './result';

/**
 * Fallback zu einem anderen Result wenn erster Err ist.
 * Entspricht Rust `or`.
 */
export function or<T, E, F>(result: Result<T, E>, other: Result<T, F>): Result<T, F> {
    return result.isOk() ? result as unknown as Result<T, F> : other;
}