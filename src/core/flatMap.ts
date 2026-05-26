import type { Result } from './result';

/**
 * Chains another operation that returns a Result.
 * Corresponds to Rust `and_then` or JS `flatMap`.
 */
export function flatMap<T, E, U, F>(project: (value: T) => Result<U, F>) {
    return (source: Result<T, E>): Result<U, E | F> => {
        if (source.isOk()) {
            return project(source.value);
        }
        return source as unknown as Result<U, E | F>;
    };
}
