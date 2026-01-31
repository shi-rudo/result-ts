import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Returns the value or calculates a default value using a function.
 * Corresponds to Rust `unwrap_or_else`.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) return fn(result.error);
    throw new InvalidResultStateError('unwrapOrElse');
}
