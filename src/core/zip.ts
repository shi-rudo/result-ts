import type { Result } from './result';
import { InvalidResultStateError } from '../errors';
import { err, ok } from './result';

function zipImpl<A, AE, B, BE>(left: Result<A, AE>, right: Result<B, BE>): Result<[A, B], AE | BE> {
    if (left.isErr()) return left as unknown as Result<[A, B], AE | BE>;
    if (right.isErr()) return right as unknown as Result<[A, B], AE | BE>;
    if (left.isOk() && right.isOk()) return ok<[A, B], AE | BE>([left.value, right.value]);
    throw new InvalidResultStateError('zip');
}

/**
 * Combines two Results into a Result of a tuple.
 * Short-circuits on the first Err (left before right).
 */
export function zip<A, AE, B, BE>(left: Result<A, AE>, right: Result<B, BE>): Result<[A, B], AE | BE>;
export function zip<A, AE, B, BE>(right: Result<B, BE>): (left: Result<A, AE>) => Result<[A, B], AE | BE>;
export function zip(...args: unknown[]): unknown {
    if (args.length === 1) {
        const right = args[0] as Result<any, any>;
        return (left: Result<any, any>) => zipImpl(left, right);
    }
    const [left, right] = args as [Result<any, any>, Result<any, any>];
    return zipImpl(left, right);
}

function combineImpl<A, AE, B, BE>(
    left: Result<A, AE>,
    right: Result<B, BE>
): Result<[A, B], Array<AE | BE>> {
    if (left.isOk() && right.isOk()) {
        return ok<[A, B], Array<AE | BE>>([left.value, right.value]);
    }

    const errors: Array<AE | BE> = [];
    if (left.isErr()) errors.push(left.error as AE | BE);
    if (right.isErr()) errors.push(right.error as AE | BE);

    return err<Array<AE | BE>, [A, B]>(errors);
}

/**
 * Combines two Results and collects errors.
 * - Ok only if both are Ok
 * - Err([errors]) if at least one is Err (left before right)
 */
export function combine<A, AE, B, BE>(
    left: Result<A, AE>,
    right: Result<B, BE>
): Result<[A, B], Array<AE | BE>>;
export function combine<A, AE, B, BE>(
    right: Result<B, BE>
): (left: Result<A, AE>) => Result<[A, B], Array<AE | BE>>;
export function combine(...args: unknown[]): unknown {
    if (args.length === 1) {
        const right = args[0] as Result<any, any>;
        return (left: Result<any, any>) => combineImpl(left, right);
    }
    const [left, right] = args as [Result<any, any>, Result<any, any>];
    return combineImpl(left, right);
}
