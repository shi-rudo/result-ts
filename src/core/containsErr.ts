import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if the Result contains a specific error.
 * Analogous to `contains` for the Err case.
 *
 * Comparison uses `Object.is` (SameValue): `NaN` matches `NaN`, `+0` and
 * `-0` are distinct, and objects are compared by reference.
 */
export function containsErr<T, E>(result: Result<T, E>, error: E): boolean {
    if (result.isErr()) return Object.is(result.error, error);
    if (result.isOk()) return false;
    throw new InvalidResultStateError('containsErr');
}
