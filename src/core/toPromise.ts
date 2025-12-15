import type { Result } from './result';

/**
 * Konvertiert ein Result zu einem Promise.
 * Ok → resolve(value), Err → reject(error)
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
    if (result.isOk()) {
        return Promise.resolve(result.value);
    }
    if (result.isErr()) return Promise.reject(result.error);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}
