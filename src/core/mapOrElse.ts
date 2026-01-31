import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Transforms the value or calculates a default value using a function.
 * Corresponds to Rust `map_or_else`.
 */
export function mapOrElse<T, E, U>(result: Result<T, E>, defaultFn: (error: E) => U, fn: (value: T) => U): U {
    if (result.isOk()) return fn(result.value);
    if (result.isErr()) return defaultFn(result.error);
    throw new InvalidResultStateError('mapOrElse');
}
