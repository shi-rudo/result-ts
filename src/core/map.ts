import type { Result } from './result';
import { ok } from './result';

/**
 * Transformiert den Wert (Ok-Fall).
 * Entspricht Rust `map`.
 */
export function map<T, E, U>(project: (value: T) => U) {
    return (source: Result<T, E>): Result<U, E> => {
        if (source.isOk()) {
            return ok(project(source.value));
        }
        return source as unknown as Result<U, E>;
    };
}
