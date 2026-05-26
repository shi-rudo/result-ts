import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Executes a side effect (logging, debugging) without changing the Result.
 * Corresponds to Rust `inspect` / `inspect_err`.
 */
export function tap<T, E>(observer: { ok?: (val: T) => void; err?: (e: E) => void }) {
    return (source: Result<T, E>): Result<T, E> => {
        if (source.isOk()) {
            if (observer.ok) observer.ok(source.value);
            return source;
        }
        if (source.isErr()) {
            if (observer.err) observer.err(source.error);
            return source;
        }
        throw new InvalidResultStateError('tap');
    };
}
