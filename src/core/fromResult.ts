import type { Result } from './result';
import { ok, err } from './result';

/**
 * Executes a function and catches exceptions.
 * Corresponds to Rust `Result::from`.
 */
export function fromResult<T>(fn: () => T): Result<T, unknown> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error);
    }
}