import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Combines two Results. Returns the second one only if the first is Ok.
 * Corresponds to Rust `and`.
 */
export function and<T, E, U>(result: Result<T, E>, other: Result<U, E>): Result<U, E> {
    if (result.isOk()) return other;
    if (result.isErr()) return result as unknown as Result<U, E>;
    throw new InvalidResultStateError('and');
}
