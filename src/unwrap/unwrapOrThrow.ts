import type { Result } from '../result';

/**
 * Returns the value or throws the original Err value (not wrapped).
 * Useful to keep `Error` instances with stack traces.
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) throw result.error;
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
