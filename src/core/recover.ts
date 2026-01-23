import type { Result } from './result';
import { ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Recover: wandelt Err in Ok(defaultValue) um.
 * Ergebnis ist garantiert Ok → Error-Typ wird `never`.
 */
export function recover<T, E, F>(defaultValue: F) {
    return (source: Result<T, E>): Result<T | F, never> => {
        if (source.isOk()) return source as unknown as Result<T | F, never>;
        if (source.isErr()) return ok(defaultValue);
        throw new InvalidResultStateError('recover');
    };
}

/**
 * Wie `recover`, aber berechnet den Default-Wert anhand des Errors.
 */
export function recoverWith<T, E, F>(fn: (error: E) => F) {
    return (source: Result<T, E>): Result<T | F, never> => {
        if (source.isOk()) return source as unknown as Result<T | F, never>;
        if (source.isErr()) return ok(fn(source.error));
        throw new InvalidResultStateError('recoverWith');
    };
}
