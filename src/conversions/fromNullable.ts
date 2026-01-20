import { err, ok, type Result } from '../result';

/**
 * Converts `null | undefined` to `Err`, everything else to `Ok`.
 * 
 * **Type Safety**: The type assertion `as NonNullable<T>` is safe,
 * as the runtime check guarantees that the value is not null/undefined.
 * 
 * @param value The value to check
 * @param error The error to use if value is null/undefined
 * @returns An Ok Result with the NonNullable value, or an Err Result with the error
 * 
 * @example
 * ```ts
 * fromNullable(user, 'User not found')
 * // Ok(user) or Err('User not found')
 * ```
 */
export function fromNullable<T, E>(value: T, error: E): Result<NonNullable<T>, E> {
    if (value === null || value === undefined) {
        return err<E, NonNullable<T>>(error);
    }
    return ok<NonNullable<T>, E>(value as NonNullable<T>);
}
