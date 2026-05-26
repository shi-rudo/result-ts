import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Fallback to another Result if the first is Err.
 * Corresponds to Rust `or`.
 */
export function or<T, E, F>(result: Result<T, E>, other: Result<T, F>): Result<T, F> {
    if (result.isOk()) return result as unknown as Result<T, F>;
    if (result.isErr()) return other;
    throw new InvalidResultStateError('or');
}
