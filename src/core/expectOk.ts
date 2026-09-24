import type { Result } from './result';
import { ExpectOkError, InvalidResultStateError } from '../errors';

/**
 * Returns the value or throws an Error with a custom message.
 * Corresponds to Rust `expect`.
 *
 * The standalone form of `.expect()`. The name `expect` would clash with the
 * global `expect` of test runners.
 */
export function expectOk<T, E>(result: Result<T, E>, message: string): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) {
        throw new ExpectOkError(message, result.error);
    }
    throw new InvalidResultStateError('expectOk');
}
