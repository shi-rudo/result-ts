import type { Result } from './result';

/**
 * Gibt den Wert zurück oder wirft einen Error.
 * Entspricht Rust `unwrap`.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.isOk()) {
        return result.value;
    }
    if (result.isErr()) throw new Error(`Called unwrap() on Err: ${String(result.error)}`);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
