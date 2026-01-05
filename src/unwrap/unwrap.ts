import type { Result } from '../result';

/**
 * Returns the value or throws an Error.
 * Equivalent to Rust `unwrap`.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) throw new Error(`Called unwrap() on Err: ${String(result.error)}`);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
