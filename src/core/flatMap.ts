import type { Result } from './result';

/**
 * Chains another operation that returns a Result.
 * Corresponds to Rust `and_then` or JS `flatMap`.
 */
export function flatMap<T, E, U>(project: (value: T) => Result<U, E>) {
    return (source: Result<T, E>): Result<U, E> => {
        if (source.isOk()) {
            return project(source.value);
        }
        return source as unknown as Result<U, E>;
    };
}
