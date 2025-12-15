import type { Result } from './result';
import { err, ok } from './result';

/**
 * Konvertiert `null | undefined` zu `Err`, alles andere zu `Ok`.
 */
export function fromNullable<T, E>(value: T, error: E): Result<NonNullable<T>, E> {
    if (value === null || value === undefined) {
        return err<E, NonNullable<T>>(error);
    }
    return ok<NonNullable<T>, E>(value as NonNullable<T>);
}

