import type { Result } from './result';
import { InvalidResultStateError, UnwrapOnErrError } from '../errors';

/**
 * Gibt den Wert zurück oder wirft einen Error.
 * Entspricht Rust `unwrap`.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) throw new UnwrapOnErrError(result.error);
    throw new InvalidResultStateError('unwrap');
}
