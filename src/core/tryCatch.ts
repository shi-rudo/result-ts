import type { Result } from './result';
import { ok, err } from './result';

/**
 * Executes a function and catches exceptions.
 * Converts exceptions into Result<E>.
 * Corresponds to Rust `Result::from` for fallible operations.
 */
export function tryCatch<T>(fn: () => T): <SE>(source: Result<unknown, SE>) => Result<T, unknown>;
export function tryCatch<T, E>(
    fn: () => T,
    errorMapper: (error: unknown) => E
): <SE>(source: Result<unknown, SE>) => Result<T, SE | E>;
export function tryCatch<T, E>(
    fn: () => T,
    errorMapper?: (error: unknown) => E
): <SE>(source: Result<unknown, SE>) => Result<T, SE | E> {
    return <SE>(source: Result<unknown, SE>): Result<T, SE | E> => {
        if (source.isErr()) return source as unknown as Result<T, SE | E>;

        try {
            return ok<T, SE | E>(fn());
        } catch (error) {
            return err<SE | E, T>(errorMapper ? errorMapper(error) : error as E);
        }
    };
}
