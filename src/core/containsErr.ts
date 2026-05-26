import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if the Result contains a specific error.
 * Analogous to `contains` for the Err case.
 */
export function containsErr<T, E>(result: Result<T, E>, error: E): boolean {
    if (result.isErr()) return result.error === error;
    if (result.isOk()) return false;
    throw new InvalidResultStateError('containsErr');
}
