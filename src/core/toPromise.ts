import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Converts a Result to a Promise.
 * Ok → resolve(value), Err → reject(error)
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
    if (result.isOk()) {
        return Promise.resolve(result.value);
    }
    if (result.isErr()) return Promise.reject(result.error);
    throw new InvalidResultStateError('toPromise');
}
