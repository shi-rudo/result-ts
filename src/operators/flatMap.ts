import type { Result } from '../result';

/**
 * Chains another operation that returns a Result.
 * Equivalent to Rust `and_then` or JS `flatMap`.
 */
export function flatMap<T, E, U, E2 = E>(project: (value: T) => Result<U, E2>) {
    return (source: Result<T, E>): Result<U, E | E2> => {
        if (source.isOk()) {
            return project(source.value) as unknown as Result<U, E | E2>;
        }
        return source as unknown as Result<U, E | E2>;
    };
}
