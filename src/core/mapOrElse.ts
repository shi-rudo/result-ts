import type { Result } from './result';

/**
 * Transformiert den Wert oder berechnet einen Default-Wert mit einer Funktion.
 * Entspricht Rust `map_or_else`.
 */
export function mapOrElse<T, E, U>(result: Result<T, E>, defaultFn: (error: E) => U, fn: (value: T) => U): U {
    if (result.isOk()) return fn(result.value);
    if (result.isErr()) return defaultFn(result.error);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
