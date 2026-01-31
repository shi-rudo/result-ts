import type { Result } from './result';
import { InvalidResultStateError, UnwrapOnErrError } from '../errors';

/**
 * Returns the value or throws an Error.
 * Corresponds to Rust `unwrap`.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) throw new UnwrapOnErrError(result.error);
    throw new InvalidResultStateError('unwrap');
}
