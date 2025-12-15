import type { Result } from './result';
import { ok } from './result';

/**
 * Recover: wandelt Err in Ok(defaultValue) um.
 * Ergebnis ist garantiert Ok → Error-Typ wird `never`.
 */
export function recover<T, E>(defaultValue: T) {
    return (source: Result<T, E>): Result<T, never> => {
        if (source.isOk()) return source as unknown as Result<T, never>;
        if (source.isErr()) return ok(defaultValue);
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}

/**
 * Wie `recover`, aber berechnet den Default-Wert anhand des Errors.
 */
export function recoverWith<T, E>(fn: (error: E) => T) {
    return (source: Result<T, E>): Result<T, never> => {
        if (source.isOk()) return source as unknown as Result<T, never>;
        if (source.isErr()) return ok(fn(source.error));
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}

