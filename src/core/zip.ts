import type { Result } from './result';
import { err, ok } from './result';

function zipImpl<A, AE, B, BE>(left: Result<A, AE>, right: Result<B, BE>): Result<[A, B], AE | BE> {
    if (left.isErr()) return left as unknown as Result<[A, B], AE | BE>;
    if (right.isErr()) return right as unknown as Result<[A, B], AE | BE>;
    if (left.isOk() && right.isOk()) return ok<[A, B], AE | BE>([left.value, right.value]);
    throw new Error('Unreachable: Result is neither Ok nor Err');
}

/**
 * Kombiniert zwei Results zu einem Result eines Tupels.
 * Short-circuits beim ersten Err (links vor rechts).
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
 * Kombiniert zwei Results und sammelt Fehler ein.
 * - Ok nur wenn beide Ok sind
 * - Err([errors]) wenn mindestens ein Err ist (links vor rechts)
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
