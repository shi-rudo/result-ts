import type { Result } from '../result';
import { unwrapOr } from './unwrapOr';

/**
 * Alias for `unwrapOr`.
 * Equivalent to Rust `unwrap_or_default` (with an explicit default value).
 */
export function unwrapOrDefault<T, E, D = T>(result: Result<T, E>, defaultValue: D): T | D {
    return unwrapOr(result, defaultValue);
}
