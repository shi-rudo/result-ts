import type { Result } from './result';
import { err } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of filter.
 */
export function filterAsync<T, E>(predicate: (val: T) => Promise<boolean>, errorFn: () => Promise<E>) {
    return async (source: Result<T, E>): Promise<Result<T, E>> => {
        if (source.isOk()) {
            if (await predicate(source.value)) {
                return source;
            }
            return err(await errorFn());
        }
        if (source.isErr()) return source;
        throw new InvalidResultStateError('filterAsync');
    };
}
