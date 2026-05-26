import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Returns the value or a default value.
 * Pure function alternative to the instance method.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) return defaultValue;
    throw new InvalidResultStateError('unwrapOr');
}
