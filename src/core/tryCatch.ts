import type { Result } from './result';
import { ok, err } from './result';

/**
 * Executes a function and catches exceptions.
 * Converts exceptions into Result<E>.
 * Corresponds to Rust `Result::from` for fallible operations.
 */
export function tryCatch<T, E = unknown>(fn: () => T, errorMapper?: (error: unknown) => E) {
    return <SE>(source: Result<unknown, SE>): Result<T, SE | E> => {
        if (source.isErr()) return source as unknown as Result<T, SE | E>;

        try {
            return ok<T, SE | E>(fn());
        } catch (error) {
            return err<SE | E, T>(errorMapper ? errorMapper(error) : error as E);
        }
    };
}
