import type { Result } from '../result';

/**
 * Flacht ein nested Result ab.
 * Result<Result<T, E>, E> → Result<T, E>
 * Entspricht Rust `flatten`.
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
    if (result.isOk()) {
        return result.value;
    }
    return result as unknown as Result<T, E>;
}
