import type { Result } from '../result';

/**
 * Async version of flatMap.
 * Allows different error types in the projected Result.
 */
export function flatMapAsync<T, E, U, E2 = E>(project: (value: T) => Promise<Result<U, E2>>) {
    return async (source: Result<T, E>): Promise<Result<U, E | E2>> => {
        if (source.isOk()) {
            return (await project(source.value)) as unknown as Result<U, E | E2>;
        }
        return source as unknown as Result<U, E | E2>;
    };
}
