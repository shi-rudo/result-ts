import type { Result } from './result';
import { ok, err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Like `map`, but catches exceptions and converts them to Err.
 */
export function tryMap<T, E, U, F = unknown>(
    project: (value: T) => U,
    errorMapper?: (error: unknown) => F
) {
    return (source: Result<T, E>): Result<U, E | F> => {
        if (source.isErr()) {
            return source as unknown as Result<U, E | F>;
        }

        try {
            if (source.isOk()) return ok<U, E | F>(project(source.value));
            throw new InvalidResultStateError('tryMap');
        } catch (error) {
            return err<E | F, U>(errorMapper ? errorMapper(error) : error as F);
        }
    };
}
