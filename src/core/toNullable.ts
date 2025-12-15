import type { Result } from './result';

/**
 * Konvertiert ein Result zu `T | null`.
 * Ok → value, Err → null
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
    if (result.isOk()) return result.value;
    return null;
}
