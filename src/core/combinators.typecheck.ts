import { and, err, ok, type Result } from '../index';

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
