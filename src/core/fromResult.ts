import type { Result } from './result';
import { ok, err } from './result';

/**
 * Führt eine Funktion aus und fängt Exceptions ab.
 * Entspricht Rust `Result::from`.
 */
export function fromResult<T>(fn: () => T): Result<T, unknown> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error);
    }
}