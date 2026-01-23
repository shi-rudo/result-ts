import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Gibt den Wert zurück oder wirft den originalen Err-Wert (nicht gewrappt).
 * Nützlich um `Error`-Instanzen inkl. Stacktrace zu erhalten.
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
    if (result.isOk()) return result.value;
    if (result.isErr()) throw result.error;
    throw new InvalidResultStateError('unwrapOrThrow');
}
