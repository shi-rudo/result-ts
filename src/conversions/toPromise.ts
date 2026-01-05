import type { Result } from '../result';

/**
 * Converts a Result to a Promise.
 * Ok → resolves with the value, Err → rejects with the error
 * 
 * @param result The Result to convert
 * @returns A Promise that resolves with the value if Ok, or rejects with the error if Err
 * 
 * @example
 * ```ts
 * const result = ok(42);
 * const promise = toPromise(result);
 * const value = await promise; // 42
 * ```
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
    if (result.isOk()) {
        return Promise.resolve(result.value!);
    }
    return Promise.reject(result.error!);
}
