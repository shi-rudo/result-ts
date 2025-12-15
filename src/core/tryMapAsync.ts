import type { Result } from './result';
import { ok, err } from './result';

/**
 * Async-Version von tryMap.
 */
export function tryMapAsync<T, E, U, F = unknown>(
    project: (value: T) => Promise<U>,
    errorMapper?: (error: unknown) => F
) {
    return async (source: Result<T, E>): Promise<Result<U, E | F>> => {
        if (source.isErr()) {
            return source as unknown as Result<U, E | F>;
        }

        try {
            if (source.isOk()) return ok<U, E | F>(await project(source.value));
            throw new Error('Unreachable: Result is neither Ok nor Err');
        } catch (error) {
            return err<E | F, U>(errorMapper ? errorMapper(error) : error as F);
        }
    };
}
