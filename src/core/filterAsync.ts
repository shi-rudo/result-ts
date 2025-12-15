import type { Result } from './result';
import { err } from './result';

/**
 * Async-Version von filter.
 */
export function filterAsync<T, E>(predicate: (val: T) => Promise<boolean>, errorFn: () => Promise<E>) {
    return async (source: Result<T, E>): Promise<Result<T, E>> => {
        if (source.isOk()) {
            if (await predicate(source.value)) {
                return source;
            }
            return err(await errorFn());
        }
        return source;
    };
}
