import type { Result } from '../result';

/**
 * Converts a Result to `T | null`.
 * Ok → returns the value, Err → returns null
 * 
 * @param result The Result to convert
 * @returns The value if Ok, or null if Err
 * 
 * @example
 * ```ts
 * const result = ok(42);
 * const value = toNullable(result); // 42
 * 
 * const errResult = err('error');
 * const nullValue = toNullable(errResult); // null
 * ```
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
    if (result.isOk()) {
        return result.value!;
    }
    return null;
}
