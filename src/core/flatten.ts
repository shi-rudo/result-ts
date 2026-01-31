import type { Result } from './result';

/**
 * Flattens a nested Result.
 * Result<Result<T, E>, E> → Result<T, E>
 * Corresponds to Rust `flatten`.
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
    if (result.isOk()) {
        return result.value;
    }
    return result as unknown as Result<T, E>;
}
