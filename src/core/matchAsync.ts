import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async-Version von match.
 */
export function matchAsync<T, E, R>(handlers: { ok: (val: T) => Promise<R>; err: (e: E) => Promise<R> }) {
    return async (source: Result<T, E>): Promise<R> => {
        if (source.isOk()) {
            return await handlers.ok(source.value);
        }
        if (source.isErr()) return await handlers.err(source.error);
        throw new InvalidResultStateError('matchAsync');
    };
}
