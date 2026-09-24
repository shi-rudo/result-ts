import type { Result } from './result';
import { InvalidResultStateError } from '../errors';

function andImpl<T, E, U, F>(result: Result<T, E>, other: Result<U, F>): Result<U, E | F> {
    if (result.isOk()) return other as Result<U, E | F>;
    if (result.isErr()) return result as unknown as Result<U, E | F>;
    throw new InvalidResultStateError('and');
}

/**
 * Combines two Results. Returns the second one only if the first is Ok.
 * Corresponds to Rust `and`.
 */
export function and<T, E, U, F>(result: Result<T, E>, other: Result<U, F>): Result<U, E | F>;
export function and<T, E, U, F>(other: Result<U, F>): (result: Result<T, E>) => Result<U, E | F>;
export function and(...args: unknown[]): unknown {
    if (args.length === 1) {
        const other = args[0] as Result<any, any>;
        return (result: Result<any, any>) => andImpl(result, other);
    }
    const [result, other] = args as [Result<any, any>, Result<any, any>];
    return andImpl(result, other);
}
