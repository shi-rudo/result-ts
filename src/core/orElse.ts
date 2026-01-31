import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Fallback with a function that returns a Result.
 * Corresponds to Rust `or_else`.
 */
export function orElse<T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>): Result<T, F> {
    if (result.isOk()) return result as unknown as Result<T, F>;
    if (result.isErr()) return fn(result.error);
    throw new InvalidResultStateError('orElse');
}
