import type { Result } from './result';
import { unwrapOr } from './unwrapOr';

/**
 * Alias for `unwrapOr`.
 * Corresponds to Rust `unwrap_or_default` (with explicit default value).
 */
export function unwrapOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
    return unwrapOr(result, defaultValue);
}

