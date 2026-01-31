import type { Result } from './result';
import { err } from './result';

/**
 * Transforms the error (Err case).
 * Corresponds to Rust `map_err`.
 */
export function mapErr<T, E, F>(project: (error: E) => F) {
    return (source: Result<T, E>): Result<T, F> => {
        if (source.isErr()) {
            return err(project(source.error));
        }
        return source as unknown as Result<T, F>;
    };
}
