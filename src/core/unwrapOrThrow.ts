import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Returns the value or throws the original Err value (not wrapped).
 * Useful to preserve `Error` instances including stack traces.
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) throw result.error;
    throw new InvalidResultStateError('unwrapOrThrow');
}
