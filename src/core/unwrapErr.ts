import type { Result } from './result';
import { InvalidResultStateError, UnwrapErrOnOkError } from '../errors';

/**
 * Returns the error or throws an Error.
 * Corresponds to Rust `unwrap_err`.
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
    if (result.isErr()) {
        return result.error;
    }
    if (result.isOk()) throw new UnwrapErrOnOkError(result.value);
    throw new InvalidResultStateError('unwrapErr');
}
