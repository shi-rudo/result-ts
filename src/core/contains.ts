import type { Result } from './result';

/**
 * Prüft ob das Result einen bestimmten Wert enthält.
 * Entspricht Rust `contains`.
 */
export function contains<T, E>(result: Result<T, E>, value: T): boolean {
    if (!result.isOk()) return false;
    return result.value === value;
}
