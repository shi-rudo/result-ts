import type { Result } from './result';

/**
 * Async version of flatMap.
 */
export function flatMapAsync<T, E, U>(project: (value: T) => Promise<Result<U, E>>) {
    return async (source: Result<T, E>): Promise<Result<U, E>> => {
        if (source.isOk()) {
            return await project(source.value);
        }
        return source as unknown as Result<U, E>;
    };
}
