import type { Result } from '../result';

/**
 * Executes a side effect (logging, debugging) without changing the Result.
 * Equivalent to Rust `inspect` / `inspect_err`.
 */
export function tap<T, E>(observer: { ok?: (val: T) => void; err?: (e: E) => void }) {
    return <SourceT extends T, SourceE extends E>(source: Result<SourceT, SourceE>): Result<SourceT, SourceE> => {
        if (source.isOk() && observer.ok) observer.ok(source.value);
        if (source.isErr() && observer.err) observer.err(source.error);
        return source;
    };
}
