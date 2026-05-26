import type { Result } from './result';
import { ExpectOkError, InvalidResultStateError } from '../errors';

/**
 * Returns the value or throws an Error with a custom message.
 * Corresponds to Rust `expect`.
 */
export function expectResult<T, E>(result: Result<T, E>, message: string): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) {
        throw new ExpectOkError(message);
    }
    throw new InvalidResultStateError('expectResult');
}
