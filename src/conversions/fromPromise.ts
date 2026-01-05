import { Result } from '../result';

/**
 * Converts a Promise to a Result-Promise.
 * Exceptions are converted to Err.
 * 
 * @param promise The Promise to convert
 * @param errorMapper Optional function to map errors to a specific type
 * @returns A Promise that resolves to an Ok Result with the value, or an Err Result with the error
 * 
 * @example
 * ```ts
 * const result = await fromPromise(fetch('/api/user'));
 * // Ok(response) or Err(error)
 * 
 * // With custom error mapper
 * const result = await fromPromise(
 *     fetch('/api/user'),
 *     (e) => `Network error: ${e}`
 * );
 * ```
 */
export function fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
export function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>>;
export async function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
    try {
        const value = await promise;
        return Result.ok<T, E>(value);
    } catch (error) {
        try {
            return Result.err(errorMapper ? errorMapper(error) : error as E);
        } catch (mapperError) {
            // If the errorMapper itself throws an error, use that one
            return Result.err(mapperError as E);
        }
    }
}