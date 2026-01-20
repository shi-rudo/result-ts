import type { Ok, Result } from './result';

/**
 * Prüft ob ein Result Ok ist.
 * Pure function Alternative zur Instanz-Methode.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
    return result.isOk();
}
