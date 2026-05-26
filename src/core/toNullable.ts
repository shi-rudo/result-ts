import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Converts a Result to `T | null`.
 * Ok → value, Err → null
 */
export function toNullable<T, E>(result: Result<T, E>): T | null {
    if (result.isOk()) return result.value;
    if (result.isErr()) return null;
    throw new InvalidResultStateError('toNullable');
}
