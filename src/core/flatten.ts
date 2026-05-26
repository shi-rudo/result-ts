import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Flattens a nested Result.
 * Result<Result<T, E>, E> → Result<T, E>
 * Corresponds to Rust `flatten`.
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) return result as unknown as Result<T, E>;
    throw new InvalidResultStateError('flatten');
}
