import type { Result } from './result';
import { ExpectOkError } from '../errors';

/**
 * Gibt den Wert zurück oder wirft einen Error mit custom Nachricht.
 * Entspricht Rust `expect`.
 */
export function expectResult<T, E>(result: Result<T, E>, message: string): T {
    if (result.isOk()) {
        return result.value;
    }
    throw new ExpectOkError(message);
}
