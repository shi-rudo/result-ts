import type { Result } from './result';
import { ok, err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Like `map`, but catches exceptions and converts them to Err.
 */
export function tryMap<T, E, U>(project: (value: T) => U): (source: Result<T, E>) => Result<U, unknown>;
export function tryMap<T, E, U, F>(
    project: (value: T) => U,
    errorMapper: (error: unknown) => F
): (source: Result<T, E>) => Result<U, E | F>;
export function tryMap<T, E, U, F>(
    project: (value: T) => U,
    errorMapper?: (error: unknown) => F
): (source: Result<T, E>) => Result<U, E | F> {
    return (source: Result<T, E>): Result<U, E | F> => {
        if (source.isErr()) {
            return source as unknown as Result<U, E | F>;
        }
        if (!source.isOk()) throw new InvalidResultStateError('tryMap');

        try {
            return ok<U, E | F>(project(source.value));
        } catch (error) {
            return err<E | F, U>(errorMapper ? errorMapper(error) : error as F);
        }
    };
}
