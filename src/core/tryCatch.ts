import type { Result } from './result';
import { ok, err } from './result';

/**
 * Führt eine Funktion aus und fängt Exceptions ab.
 * Wandelt Exceptions in Result<E> um.
 * Entspricht Rust `Result::from` für fallible Operationen.
 */
export function tryCatch<T, E = unknown>(fn: () => T, errorMapper?: (error: unknown) => E) {
    return (source: Result<any, any>): Result<T, E> => {
        if (source.isErr()) return source as unknown as Result<T, E>;

        try {
            return ok(fn());
        } catch (error) {
            return err(errorMapper ? errorMapper(error) : error as E);
        }
    };
}