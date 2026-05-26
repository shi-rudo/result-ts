import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Transforms the value or returns a default value.
 * Corresponds to Rust `map_or`.
 */
export function mapOr<T, E, U>(result: Result<T, E>, defaultValue: U, fn: (value: T) => U): U {
    if (result.isOk()) return fn(result.value);
    if (result.isErr()) return defaultValue;
    throw new InvalidResultStateError('mapOr');
}
