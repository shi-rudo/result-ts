import type { Result } from './result';
import { err } from './result';

/**
 * Prüft eine Bedingung. Wenn falsch, wird das Result zu Err.
 * Entspricht Rust `filter` (teilweise).
 */
export function filter<T, E>(predicate: (val: T) => boolean, errorFn: () => E) {
    return (source: Result<T, E>): Result<T, E> => {
        if (source.isOk()) {
            if (predicate(source.value)) {
                return source;
            }
            return err(errorFn());
        }
        return source;
    };
}
