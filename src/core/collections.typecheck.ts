import {
    all,
    collectAllErrors,
    collectFirstOk,
    collectFirstOkAsync,
    collectFirstOkParallelAsync,
    err,
    ok,
    sequence,
    sequenceRecord,
    type Result,
} from '../index';

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

const collectedFirstOk = collectFirstOk([
    err<'number-error', number>('number-error'),
    ok<string, 'string-error'>('a'),
] as const);

type CollectFirstOkUnionsOkValuesAndErrorArray = Expect<
    Equal<typeof collectedFirstOk, Result<number | string, Array<'number-error' | 'string-error'>>>
>;

const collectedFirstOkAsync = collectFirstOkAsync([
    Promise.resolve(err<'number-error', number>('number-error')),
    async () => ok<string, 'string-error'>('a'),
] as const);

type CollectFirstOkAsyncWithoutMapperCollectsUnknownErrors = Expect<
    Equal<typeof collectedFirstOkAsync, Promise<Result<number | string, unknown[]>>>
>;

const collectedFirstOkAsyncMapped = collectFirstOkAsync(
    [
        Promise.resolve(err<'number-error', number>('number-error')),
        async () => ok<string, 'string-error'>('a'),
    ] as const,
    reason => ({ rejected: reason }),
);

type CollectFirstOkAsyncWithMapperUnionsErrValuesAndMappedRejections = Expect<
    Equal<
        typeof collectedFirstOkAsyncMapped,
        Promise<Result<number | string, Array<'number-error' | 'string-error' | { rejected: unknown }>>>
    >
>;

const collectedFirstOkParallelAsync = collectFirstOkParallelAsync([
    Promise.resolve(err<'number-error', number>('number-error')),
    () => ok<string, 'string-error'>('a'),
] as const);

type CollectFirstOkParallelAsyncWithoutMapperCollectsUnknownErrors = Expect<
    Equal<typeof collectedFirstOkParallelAsync, Promise<Result<number | string, unknown[]>>>
>;

const collectedFirstOkParallelAsyncMapped = collectFirstOkParallelAsync(
    [
        Promise.resolve(err<'number-error', number>('number-error')),
        () => ok<string, 'string-error'>('a'),
    ] as const,
    reason => ({ rejected: reason }),
);

type CollectFirstOkParallelAsyncWithMapperUnionsErrValuesAndMappedRejections = Expect<
    Equal<
        typeof collectedFirstOkParallelAsyncMapped,
        Promise<Result<number | string, Array<'number-error' | 'string-error' | { rejected: unknown }>>>
    >
>;

const sequencedRecord = sequenceRecord({ a: ok<number, 'a-error'>(1), b: ok<string, 'b-error'>('x') });

type SequenceRecordMapsValuesAndUnionsErrors = Expect<
    Equal<typeof sequencedRecord, Result<{ readonly a: number; readonly b: string }, 'a-error' | 'b-error'>>
>;

const recordSymbol = Symbol('id');
const sequencedSymbolRecord = sequenceRecord({ [recordSymbol]: ok<number, 'id-error'>(1) });

type SequenceRecordKeepsSymbolKeys = Expect<
    Equal<typeof sequencedSymbolRecord, Result<{ readonly [recordSymbol]: number }, 'id-error'>>
>;

const sequencedLengthRecord = sequenceRecord({ length: ok<number, 'length-error'>(3) });

type SequenceRecordAcceptsAResultUnderTheKeyLength = Expect<
    Equal<typeof sequencedLengthRecord, Result<{ readonly length: number }, 'length-error'>>
>;

function sequenceGenericRecord<R extends Record<string, Result<number, string>>>(record: R) {
    return sequenceRecord(record);
}

const sequencedGenericRecord = sequenceGenericRecord({ a: ok<number, string>(1), b: ok<number, string>(2) });

type SequenceRecordKeepsTheReturnTypeOfAGenericCaller = Expect<
    Equal<typeof sequencedGenericRecord, Result<{ a: number; b: number }, string>>
>;

declare const resultList: Result<number, string>[];
declare const readonlyResultList: readonly Result<number, string>[];

// @ts-expect-error An array belongs to sequence(), not sequenceRecord().
sequenceRecord([ok(1), ok(2)]);

// @ts-expect-error A tuple belongs to sequence(), not sequenceRecord().
sequenceRecord([ok(1), ok('x')] as const);

// @ts-expect-error An array variable belongs to sequence(), not sequenceRecord().
sequenceRecord(resultList);

// @ts-expect-error A readonly array variable belongs to sequence(), not sequenceRecord().
sequenceRecord(readonlyResultList);
