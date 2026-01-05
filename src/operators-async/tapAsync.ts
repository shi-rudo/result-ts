import type { Result } from '../result';

/**
 * Async version of tap.
 */
export function tapAsync<T, E>(observer: { ok?: (val: T) => Promise<void>; err?: (e: E) => Promise<void> }) {
    return async <SourceT extends T, SourceE extends E>(source: Result<SourceT, SourceE>): Promise<Result<SourceT, SourceE>> => {
        if (source.isOk() && observer.ok) await observer.ok(source.value);
        if (source.isErr() && observer.err) await observer.err(source.error);
        return source;
    };
}
