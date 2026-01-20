import { err, ok, type Result } from '../result';

/**
 * Executes a function and catches exceptions.
 * 
 * @param fn The function to execute
 * @returns An Ok Result with the return value, or an Err Result with the caught exception
 * 
 * @example
 * ```ts
 * const result = tryFn(() => JSON.parse(input));
 * // Ok(parsed) or Err(SyntaxError)
 * ```
 */
export function tryFn<T>(fn: () => T): Result<T, unknown> {
    try {
        return ok(fn());
    } catch (error) {
        return err(error);
    }
}
