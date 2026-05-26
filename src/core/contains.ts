import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Checks if the Result contains a specific value.
 * Corresponds to Rust `contains`.
 */
export function contains<T, E>(result: Result<T, E>, value: T): boolean {
    if (result.isOk()) return result.value === value;
    if (result.isErr()) return false;
    throw new InvalidResultStateError('contains');
}
