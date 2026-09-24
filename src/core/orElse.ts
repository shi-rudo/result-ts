import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

function orElseImpl<T, E, U, F>(result: Result<T, E>, fn: (error: E) => Result<U, F>): Result<T | U, F> {
    if (result.isOk()) return result as unknown as Result<T | U, F>;
    if (result.isErr()) return fn(result.error) as Result<T | U, F>;
    throw new InvalidResultStateError('orElse');
}

/**
 * Fallback with a function that returns a Result.
 * Corresponds to Rust `or_else`.
 */
export function orElse<T, E, U, F>(result: Result<T, E>, fn: (error: E) => Result<U, F>): Result<T | U, F>;
export function orElse<T, E, U, F>(fn: (error: E) => Result<U, F>): (result: Result<T, E>) => Result<T | U, F>;
export function orElse(...args: unknown[]): unknown {
    if (args.length === 1) {
        const fn = args[0] as (error: any) => Result<any, any>;
        return (result: Result<any, any>) => orElseImpl(result, fn);
    }
    const [result, fn] = args as [Result<any, any>, (error: any) => Result<any, any>];
    return orElseImpl(result, fn);
}
