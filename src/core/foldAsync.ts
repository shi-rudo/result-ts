import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of `fold`. Folds the Result into a single value asynchronously.
 * The end of the pipe.
 *
 * This is the async pipe operator equivalent of the `.fold()` instance method.
 */
export function foldAsync<T, E, R1, R2 = R1>(handlers: { ok: (val: T) => Awaitable<R1>; err: (e: E) => Awaitable<R2> }) {
    return async (source: Result<T, E>): Promise<R1 | R2> => {
        if (source.isOk()) {
            return await handlers.ok(source.value);
        }
        if (source.isErr()) return await handlers.err(source.error);
        throw new InvalidResultStateError('foldAsync');
    };
}
