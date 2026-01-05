import type { Result } from '../result';

/**
 * Returns the value or throws an Error with a custom message.
 * Equivalent to Rust `expect`.
 */
export function expectResult<T, E>(result: Result<T, E>, message: string): T {
    if (result.isOk()) {
        return result.value;
    }
    throw new Error(message);
}
