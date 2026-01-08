import type { Result } from '../result';

/**
 * Checks whether the Result contains a specific value.
 * Equivalent to Rust `contains`.
 */
export function contains<T, E>(result: Result<any, E>, value: T): boolean {
    if (!result.isOk()) return false;
    return result.value === value;
}
