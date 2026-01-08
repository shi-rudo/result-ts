import type { Result } from '../result';

/**
 * Transforms the value or returns a default value.
 * Equivalent to Rust `map_or`.
 */
export function mapOr<T, E, U>(result: Result<T, E>, defaultValue: U, fn: (value: T) => U): U {
    if (result.isOk()) return fn(result.value);
    return defaultValue;
}
