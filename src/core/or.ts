import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

function orImpl<T, E, U, F>(result: Result<T, E>, other: Result<U, F>): Result<T | U, F> {
    if (result.isOk()) return result as unknown as Result<T | U, F>;
    if (result.isErr()) return other as Result<T | U, F>;
    throw new InvalidResultStateError('or');
}

/**
 * Fallback to another Result if the first is Err.
 * Corresponds to Rust `or`.
 */
export function or<T, E, U, F>(result: Result<T, E>, other: Result<U, F>): Result<T | U, F>;
export function or<T, E, U, F>(other: Result<U, F>): (result: Result<T, E>) => Result<T | U, F>;
export function or(...args: unknown[]): unknown {
    if (args.length === 1) {
        const other = args[0] as Result<any, any>;
        return (result: Result<any, any>) => orImpl(result, other);
    }
    const [result, other] = args as [Result<any, any>, Result<any, any>];
    return orImpl(result, other);
}
