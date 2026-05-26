import type { Result } from './result';
import { err } from './result';
import { InvalidResultStateError } from '../errors';

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
        if (source.isErr()) return source;
        throw new InvalidResultStateError('filter');
    };
}
