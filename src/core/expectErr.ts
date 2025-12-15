import type { Result } from './result';

/**
 * Gibt den Fehler zurück oder wirft einen Error mit custom Nachricht.
 * Entspricht Rust `expect_err`.
 */
export function expectErr<T, E>(result: Result<T, E>, message: string): E {
    if (result.isErr()) {
        return result.error;
    }
    throw new Error(message);
}
