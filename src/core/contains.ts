import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if the Result contains a specific value.
 * Corresponds to Rust `contains`.
 *
 * Comparison uses `Object.is` (SameValue): `NaN` matches `NaN`, `+0` and
 * `-0` are distinct, and objects are compared by reference.
 */
export function contains<T, E>(result: Result<T, E>, value: T): boolean {
    if (result.isOk()) return Object.is(result.value, value);
    if (result.isErr()) return false;
    throw new InvalidResultStateError('contains');
}
