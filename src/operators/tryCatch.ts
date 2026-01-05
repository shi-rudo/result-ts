import type { Result } from '../result';
import { ok, err } from '../result';

/**
 * Executes a function and catches exceptions.
 * Converts exceptions into Result<E>.
 * Equivalent to Rust `Result::from` for fallible operations.
 */
export function tryCatch<T, E = unknown>(fn: () => T, errorMapper?: (error: unknown) => E) {
    return <SourceT, SourceE>(source: Result<SourceT, SourceE>): Result<T | SourceT, E | SourceE> => {
        // Cast needed: Result is invariant, but we know this is safe at runtime
        if (source.isErr()) return source as unknown as Result<T | SourceT, E | SourceE>;

        try {
            return ok(fn()) as unknown as Result<T | SourceT, E | SourceE>;
        } catch (error) {
            return err(errorMapper ? errorMapper(error) : (error as E)) as unknown as Result<T | SourceT, E | SourceE>;
        }
    };
}
