import type { Result } from './result';
import { err } from './result';

/**
 * Checks a condition. If false, the Result becomes Err.
 * Corresponds to Rust `filter` (partially).
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
