import type { Result } from './result';
import { ok, err } from './result';

/**
 * Executes a function and catches exceptions.
 * Converts exceptions into Result<E>.
 * Corresponds to Rust `Result::from` for fallible operations.
 */
export function tryCatch<T, E = unknown>(fn: () => T, errorMapper?: (error: unknown) => E) {
    return (source: Result<any, any>): Result<T, E> => {
        if (source.isErr()) return source as unknown as Result<T, E>;

        try {
            return ok(fn());
        } catch (error) {
            return err(errorMapper ? errorMapper(error) : error as E);
        }
    };
}