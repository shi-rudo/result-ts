import type { Result } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Swaps Ok and Err.
 * Result<T, E> → Result<E, T>
 */
export function swap<T, E>(result: Result<T, E>): Result<E, T> {
    if (result.isOk()) {
        return err<T, E>(result.value);
    }
    if (result.isErr()) {
        return ok<E, T>(result.error);
    }
    throw new InvalidResultStateError('swap');
}
