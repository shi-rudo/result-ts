import type { Result } from './result';
import { InvalidResultStateError, UnwrapErrOnOkError } from '../errors';

/**
 * Gibt den Fehler zurück oder wirft einen Error.
 * Entspricht Rust `unwrap_err`.
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
    if (result.isErr()) {
        return result.error;
    }
    if (result.isOk()) throw new UnwrapErrOnOkError(result.value);
    throw new InvalidResultStateError('unwrapErr');
}
