import type { Result } from './result';
import { unwrapOr } from './unwrapOr';

/**
 * Alias für `unwrapOr`.
 * Entspricht Rust `unwrap_or_default` (mit explizitem Default-Wert).
 */
export function unwrapOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
    return unwrapOr(result, defaultValue);
}

