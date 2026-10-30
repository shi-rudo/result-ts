import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of flatMap.
 */
export function flatMapAsync<T, E, U, F>(project: (value: T) => Awaitable<Result<U, F>>) {
    return async (source: Result<T, E>): Promise<Result<U, E | F>> => {
        if (source.isOk()) {
            return await project(source.value);
        }
        if (source.isErr()) return source as unknown as Result<U, E | F>;
        throw new InvalidResultStateError('flatMapAsync');
    };
}
