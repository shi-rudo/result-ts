import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Recover: converts Err to Ok(defaultValue).
 * Result is guaranteed to be Ok → Error type becomes `never`.
 */
export function recover<T, E, F>(defaultValue: F) {
    return (source: Result<T, E>): Result<T | F, never> => {
        if (source.isOk()) return source as unknown as Result<T | F, never>;
        if (source.isErr()) return ok(defaultValue);
        throw new InvalidResultStateError('recover');
    };
}

/**
 * Like `recover`, but calculates the default value based on the error.
 */
export function recoverWith<T, E, F>(fn: (error: E) => F) {
    return (source: Result<T, E>): Result<T | F, never> => {
        if (source.isOk()) return source as unknown as Result<T | F, never>;
        if (source.isErr()) return ok(fn(source.error));
        throw new InvalidResultStateError('recoverWith');
    };
}
