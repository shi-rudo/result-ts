import { all, collectAllErrors, err, ok, sequence, type Result } from '../index';

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

const collectedAllOk = collectAllErrors([
    ok<number, 'number-error'>(1),
    ok<string, 'string-error'>('a'),
] as const);

type CollectAllErrorsPreservesTupleValuesAndErrorArrayUnion = Expect<
    Equal<typeof collectedAllOk, Result<[number, string], Array<'number-error' | 'string-error'>>>
>;

const collectedWithErrors = collectAllErrors([
    ok<number, 'number-error'>(1),
    err<'string-error', string>('string-error'),
] as const);

type CollectAllErrorsUnionsOkValuesAndErrorArray = Expect<
    Equal<typeof collectedWithErrors, Result<[number, string], Array<'number-error' | 'string-error'>>>
>;
