import type { Result } from './result';

/**
 * Gibt den Wert zurück oder berechnet einen Default-Wert mit einer Funktion.
 * Entspricht Rust `unwrap_or_else`.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) return fn(result.error);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
