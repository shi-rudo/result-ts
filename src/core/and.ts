import type { Result } from './result';

/**
 * Kombiniert zwei Results. Gibt den zweiten zurück nur wenn erster Ok ist.
 * Entspricht Rust `and`.
 */
export function and<T, E, U>(result: Result<T, E>, other: Result<U, E>): Result<U, E> {
    return result.isOk() ? other : result as unknown as Result<U, E>;
}