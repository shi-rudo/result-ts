import type { Result } from './result';
import { err } from './result';

/**
 * Async-Version von mapErr.
 */
export function mapErrAsync<T, E, F>(project: (error: E) => Promise<F>) {
    return async (source: Result<T, E>): Promise<Result<T, F>> => {
        if (source.isErr()) {
            return err(await project(source.error));
        }
        return source as unknown as Result<T, F>;
    };
}
