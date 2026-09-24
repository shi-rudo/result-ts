import { and, err, ok, or, orElse, type Result } from '../index';
import * as collectionsEntry from '../collections';
import * as operatorsEntry from '../operators';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

const andResult = and(
    ok<number, 'left-error'>(1),
    err<'right-error', string>('right-error')
);

type AndUnionsLeftAndRightErrors = Expect<
    Equal<typeof andResult, Result<string, 'left-error' | 'right-error'>>
>;

const pipedAnd = ok<number, 'left-error'>(1).pipe(and(err<'right-error', string>('right-error')));

type AndInAPipeUnionsLeftAndRightErrors = Expect<
    Equal<typeof pipedAnd, Result<string, 'left-error' | 'right-error'>>
>;

const orResult = or(err<'left-error', number>('left-error'), ok<string, 'right-error'>('fallback'));
const pipedOr = err<'left-error', number>('left-error').pipe(or(ok<string, 'right-error'>('fallback')));

type OrUnionsBothValuesAndKeepsTheFallbackError = Expect<
    Equal<typeof orResult | typeof pipedOr, Result<number | string, 'right-error'>>
>;

const orElseResult = orElse(err<'left-error', number>('left-error'), error => ok<string, 'fallback-error'>(error));
const pipedOrElse = err<'left-error', number>('left-error').pipe(orElse(error => ok<string, 'fallback-error'>(error)));

type OrElseUnionsBothValuesAndKeepsTheFallbackError = Expect<
    Equal<typeof orElseResult | typeof pipedOrElse, Result<number | string, 'fallback-error'>>
>;

// flatten works on a single Result, so it is an operator and not a collection.
void operatorsEntry.flatten;

// @ts-expect-error `flatten` is exported from `@shirudo/result/operators`, not from `@shirudo/result/collections`.
void collectionsEntry.flatten;
