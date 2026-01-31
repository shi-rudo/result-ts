import type { Result } from './result';
import { ExpectErrError } from '../errors';

/**
 * Returns the error or throws an Error with a custom message.
 * Corresponds to Rust `expect_err`.
 */
export function expectErr<T, E>(result: Result<T, E>, message: string): E {
    if (result.isErr()) {
        return result.error;
    }
    throw new ExpectErrError(message);
}
