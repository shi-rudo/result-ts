import type { Result } from './result';

/**
 * Gibt den Wert zurück oder einen Default-Wert.
 * Pure function Alternative zur Instanz-Methode.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.isOk()) return result.value;
    return defaultValue;
}
