import type { Result } from './result';

/**
 * Async-Version von tap.
 */
export function tapAsync<T, E>(observer: { ok?: (val: T) => Promise<void>; err?: (e: E) => Promise<void> }) {
    return async (source: Result<T, E>): Promise<Result<T, E>> => {
        if (source.isOk() && observer.ok) await observer.ok(source.value);
        if (source.isErr() && observer.err) await observer.err(source.error);
        return source;
    };
}
