import type { Result } from './result';

/**
 * Prüft ob ein Result Err ist.
 * Pure function Alternative zur Instanz-Methode.
 */
export function isErr<T, E>(result: Result<T, E>): result is Result<T, E> & { readonly value: undefined; readonly error: E } {
    return result.isErr();
}
