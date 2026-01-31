import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Resolves the Result. The end of the pipe.
 * Corresponds to Rust `match`.
 */
export function match<T, E, R>(handlers: { ok: (val: T) => R; err: (e: E) => R }) {
    return (source: Result<T, E>): R => {
        if (source.isOk()) {
            return handlers.ok(source.value);
        }
        if (source.isErr()) return handlers.err(source.error);
        throw new InvalidResultStateError('match');
    };
}
