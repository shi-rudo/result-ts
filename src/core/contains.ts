import type { Result } from './result';

/**
 * Checks if the Result contains a specific value.
 * Corresponds to Rust `contains`.
 */
export function contains<T, E>(result: Result<T, E>, value: T): boolean {
    if (!result.isOk()) return false;
    return result.value === value;
}
