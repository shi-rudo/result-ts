import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of map.
 */
export function mapAsync<T, E, U>(project: (value: T) => Promise<U>) {
    return async (source: Result<T, E>): Promise<Result<U, E>> => {
        if (source.isOk()) {
            return ok(await project(source.value));
        }
        if (source.isErr()) return source as unknown as Result<U, E>;
        throw new InvalidResultStateError('mapAsync');
    };
}
