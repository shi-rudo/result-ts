import { all, ok, sequence, type Result } from '../index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

const sequenced = sequence([
    ok<number, 'number-error'>(1),
    ok<string, 'string-error'>('a'),
] as const);

type SequencePreservesTupleValuesAndErrorUnion = Expect<
    Equal<typeof sequenced, Result<[number, string], 'number-error' | 'string-error'>>
>;

const allSequenced = all([
    ok<number, 'number-error'>(1),
    ok<string, 'string-error'>('a'),
] as const);

type AllPreservesTupleValuesAndErrorUnion = Expect<
    Equal<typeof allSequenced, Result<[number, string], 'number-error' | 'string-error'>>
>;
