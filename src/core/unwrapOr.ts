import type { Result } from './result';

/**
 * Returns the value or a default value.
 * Pure function alternative to the instance method.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.isOk()) return result.value;
    return defaultValue;
}
