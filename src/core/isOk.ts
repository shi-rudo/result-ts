import type { Result } from './result';

/**
 * Prüft ob ein Result Ok ist.
 * Pure function Alternative zur Instanz-Methode.
 */
export function isOk<T, E>(result: Result<T, E>): result is Result<T, E> & { readonly value: T; readonly error: undefined } {
    return result.isOk();
}
