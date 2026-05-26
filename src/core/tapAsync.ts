import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Async version of tap.
 */
export function tapAsync<T, E>(observer: { ok?: (val: T) => Promise<void>; err?: (e: E) => Promise<void> }) {
    return async (source: Result<T, E>): Promise<Result<T, E>> => {
        if (source.isOk()) {
            if (observer.ok) await observer.ok(source.value);
            return source;
        }
        if (source.isErr()) {
            if (observer.err) await observer.err(source.error);
            return source;
        }
        throw new InvalidResultStateError('tapAsync');
    };
}
