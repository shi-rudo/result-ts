import type { Result } from '../result';
import { ok, err } from '../result';

/**
 * Async version of tryCatch.
 */
export function tryCatchAsync<T, E = unknown>(
    fn: () => Promise<T>,
    errorMapper?: (error: unknown) => E
) {
    return async <SourceT, SourceE>(source: Result<SourceT, SourceE>): Promise<Result<T, E | SourceE>> => {
        if (source.isErr()) return source as unknown as Result<T, E | SourceE>;

        try {
            return ok<T, E | SourceE>(await fn());
        } catch (error) {
            return err(errorMapper ? errorMapper(error) : error as E);
        }
    };
}
