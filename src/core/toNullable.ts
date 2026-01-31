import type { Result } from './result';

/**
 * Converts a Result to `T | null`.
 * Ok → value, Err → null
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
    if (result.isOk()) return result.value;
    return null;
}
