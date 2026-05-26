import type { Ok, Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if a Result is Ok.
 * Pure function alternative to the instance method.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
    if (result.isOk()) return true;
    if (result.isErr()) return false;
    throw new InvalidResultStateError('isOk');
}
