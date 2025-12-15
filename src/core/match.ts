import type { Result } from './result';

/**
 * Löst das Result auf. Das Ende der Pipe.
 * Entspricht Rust `match`.
 */
export function match<T, E, R>(handlers: { ok: (val: T) => R; err: (e: E) => R }) {
    return (source: Result<T, E>): R => {
        if (source.isOk()) {
            return handlers.ok(source.value);
        }
        if (source.isErr()) return handlers.err(source.error);
        throw new Error('Unreachable: Result is neither Ok nor Err');
    };
}
