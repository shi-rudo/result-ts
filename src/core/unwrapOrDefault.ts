import type { Result } from './result';
import { unwrapOr } from './unwrapOr';

/**
 * Alias for `unwrapOr`.
 *
 * @deprecated Use {@link unwrapOr} instead. The name is misleading: Rust's
 * `unwrap_or_default` takes no argument (it uses the type's `Default`),
 * whereas this function requires an explicit default value — which is exactly
 * what `unwrapOr` does.
 */
export function unwrapOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
    return unwrapOr(result, defaultValue);
}

