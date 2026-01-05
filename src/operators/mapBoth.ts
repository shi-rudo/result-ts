import type { Result } from '../result';
import { err, ok } from '../result';

/**
 * Transforms both the Ok value and the Err error.
 * Equivalent to FP `bimap` / `mapBoth`.
 */
export function mapBoth<T, E, U, F>(mapOk: (value: T) => U, mapErr: (error: E) => F) {
    return (source: Result<T, E>): Result<U, F> => {
        if (source.isOk()) {
            return ok<U, F>(mapOk(source.value));
        }
        if (source.isErr()) {
            return err<F, U>(mapErr(source.error));
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}

/**
 * Alias for `mapBoth`.
 */
export const bimap = mapBoth;
