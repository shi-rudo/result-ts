import type { Result } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Transformiert sowohl den Ok-Wert als auch den Err-Fehler.
 * Entspricht FP `bimap` / `mapBoth`.
 */
export function mapBoth<T, E, U, F>(mapOk: (value: T) => U, mapErr: (error: E) => F) {
    return (source: Result<T, E>): Result<U, F> => {
        if (source.isOk()) {
            return ok<U, F>(mapOk(source.value));
        }
        if (source.isErr()) {
            return err<F, U>(mapErr(source.error));
        }
        throw new InvalidResultStateError('mapBoth');
    };
}

/**
 * Alias für `mapBoth`.
 */
export const bimap = mapBoth;
