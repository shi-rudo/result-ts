import type { Result } from './result';
import { ok, err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of tryMap.
 */
export function tryMapAsync<T, E, U>(project: (value: T) => Promise<U>): (source: Result<T, E>) => Promise<Result<U, unknown>>;
export function tryMapAsync<T, E, U, F>(
    project: (value: T) => Promise<U>,
    errorMapper: (error: unknown) => F
): (source: Result<T, E>) => Promise<Result<U, E | F>>;
export function tryMapAsync<T, E, U, F>(
    project: (value: T) => Promise<U>,
    errorMapper?: (error: unknown) => F
): (source: Result<T, E>) => Promise<Result<U, E | F>> {
    return async (source: Result<T, E>): Promise<Result<U, E | F>> => {
        if (source.isErr()) {
            return source as unknown as Result<U, E | F>;
        }
        if (!source.isOk()) throw new InvalidResultStateError('tryMapAsync');

        try {
            return ok<U, E | F>(await project(source.value));
        } catch (error) {
            return err<E | F, U>(errorMapper ? errorMapper(error) : error as F);
        }
    };
}
