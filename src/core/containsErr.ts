import type { Result } from './result';

/**
 * Prüft ob das Result einen bestimmten Fehler enthält.
 * Analog zu `contains` für den Err-Fall.
 */
export function containsErr<T, E>(result: Result<T, E>, error: E): boolean {
    if (!result.isErr()) return false;
    return result.error === error;
}
