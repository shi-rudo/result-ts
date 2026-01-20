import type { Err, Result } from './result';

/**
 * Prüft ob ein Result Err ist.
 * Pure function Alternative zur Instanz-Methode.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
    return result.isErr();
}
