import type { Result } from './result';

/**
 * Verkettet eine weitere Operation, die ein Result zurückgibt.
 * Entspricht Rust `and_then` oder JS `flatMap`.
 */
export function flatMap<T, E, U>(project: (value: T) => Result<U, E>) {
    return (source: Result<T, E>): Result<U, E> => {
        if (source.isOk()) {
            return project(source.value);
        }
        return source as unknown as Result<U, E>;
    };
}
