import type { Result } from '../result';
import { ok } from '../result';

/**
 * Recover: turns Err into Ok(defaultValue).
 * Result is guaranteed Ok → error type becomes `never`.
 */
export function recover<T, E, D = T>(defaultValue: D) {
    return (source: Result<T, E>): Result<T | D, never> => {
        if (source.isOk()) return source as unknown as Result<T | D, never>;
        if (source.isErr()) return ok(defaultValue) as unknown as Result<T | D, never>;
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}

/**
 * Like `recover`, but computes the default value from the error.
 */
export function recoverWith<T, E, D = T>(fn: (error: E) => D) {
    return (source: Result<T, E>): Result<T | D, never> => {
        if (source.isOk()) return source as unknown as Result<T | D, never>;
        if (source.isErr()) return ok(fn(source.error)) as unknown as Result<T | D, never>;
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}
