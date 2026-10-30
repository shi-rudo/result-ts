import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Folds the Result into a single value by applying one of two functions.
 * The end of the pipe.
 *
 * This is the pipe operator equivalent of the `.fold()` instance method.
 */
export function fold<T, E, R1, R2 = R1>(handlers: { ok: (val: T) => R1; err: (e: E) => R2 }) {
    return (source: Result<T, E>): R1 | R2 => {
        if (source.isOk()) {
            return handlers.ok(source.value);
        }
        if (source.isErr()) return handlers.err(source.error);
        throw new InvalidResultStateError('fold');
    };
}
