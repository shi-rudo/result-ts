import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of `fold`. Folds the Result into a single value asynchronously.
 * The end of the pipe.
 *
 * This is the async pipe operator equivalent of the `.fold()` instance method.
 */
export function foldAsync<T, E, R>(handlers: { ok: (val: T) => Awaitable<R>; err: (e: E) => Awaitable<R> }) {
    return async (source: Result<T, E>): Promise<R> => {
        if (source.isOk()) {
            return await handlers.ok(source.value);
        }
        if (source.isErr()) return await handlers.err(source.error);
        throw new InvalidResultStateError('foldAsync');
    };
}
