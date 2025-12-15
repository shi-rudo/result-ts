import type { Result } from './result';

/**
 * Gibt den Fehler zurück oder wirft einen Error.
 * Entspricht Rust `unwrap_err`.
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
    if (result.isErr()) {
        return result.error;
    }
    if (result.isOk()) throw new Error(`Called unwrapErr() on Ok: ${String(result.value)}`);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
