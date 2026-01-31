import type { Result } from './result';
import { ok, err } from './result';

/**
 * Async version of tryCatch.
 */
export function tryCatchAsync<T, E = unknown>(
    fn: () => Promise<T>,
    errorMapper?: (error: unknown) => E
) {
    return async (source: Result<any, any>): Promise<Result<T, E>> => {
        if (source.isErr()) return source as unknown as Result<T, E>;

        try {
            return ok(await fn());
        } catch (error) {
            return err(errorMapper ? errorMapper(error) : error as E);
        }
    };
}