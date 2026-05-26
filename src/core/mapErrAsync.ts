import type { Result } from './result';
import { err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of mapErr.
 */
export function mapErrAsync<T, E, F>(project: (error: E) => Promise<F>) {
    return async (source: Result<T, E>): Promise<Result<T, F>> => {
        if (source.isErr()) {
            return err(await project(source.error));
        }
        if (source.isOk()) return source as unknown as Result<T, F>;
        throw new InvalidResultStateError('mapErrAsync');
    };
}
