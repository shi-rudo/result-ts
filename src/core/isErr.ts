import type { Err, Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if a Result is Err.
 * Pure function alternative to the instance method.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
    if (result.isErr()) return true;
    if (result.isOk()) return false;
    throw new InvalidResultStateError('isErr');
}
