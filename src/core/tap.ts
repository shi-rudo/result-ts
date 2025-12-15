import type { Result } from './result';

/**
 * Führt einen Seiteneffekt aus (Logging, Debugging), ohne das Result zu ändern.
 * Entspricht Rust `inspect` / `inspect_err`.
 */
export function tap<T, E>(observer: { ok?: (val: T) => void; err?: (e: E) => void }) {
    return (source: Result<T, E>): Result<T, E> => {
        if (source.isOk() && observer.ok) observer.ok(source.value);
        if (source.isErr() && observer.err) observer.err(source.error);
        return source;
    };
}
