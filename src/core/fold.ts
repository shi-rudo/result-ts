import type { Result } from './result';

/**
 * Folds the Result into a single value by applying one of two functions.
 * The end of the pipe.
 *
 * This is the pipe operator equivalent of the `.fold()` instance method.
 */
export function fold<T, E, R>(handlers: { ok: (val: T) => R; err: (e: E) => R }) {
    return (source: Result<T, E>): R => {
        if (source.isOk()) {
            return handlers.ok(source.value);
        }
        if (source.isErr()) return handlers.err(source.error);
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}
