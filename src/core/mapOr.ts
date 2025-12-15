import type { Result } from './result';

/**
 * Transformiert den Wert oder gibt einen Default-Wert zurück.
 * Entspricht Rust `map_or`.
 */
export function mapOr<T, E, U>(result: Result<T, E>, defaultValue: U, fn: (value: T) => U): U {
    if (result.isOk()) return fn(result.value);
    return defaultValue;
}
