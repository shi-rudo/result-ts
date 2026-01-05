import type { Result } from '../result';

/**
 * Returns the error or throws an Error with a custom message.
 * Equivalent to Rust `expect_err`.
 */
export function expectErr<T, E>(result: Result<T, E>, message: string): E {
    if (result.isErr()) {
        return result.error;
    }
    throw new Error(message);
}
