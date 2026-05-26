import type { Result } from './result';
import { ok, err } from './result';

/**
 * Async version of tryCatch.
 */
export function tryCatchAsync<T, E = unknown>(
    fn: () => Promise<T>,
    errorMapper?: (error: unknown) => E
) {
    return async <SE>(source: Result<unknown, SE>): Promise<Result<T, SE | E>> => {
        if (source.isErr()) return source as unknown as Result<T, SE | E>;

        try {
            return ok<T, SE | E>(await fn());
        } catch (error) {
            return err<SE | E, T>(errorMapper ? errorMapper(error) : error as E);
        }
    };
}
