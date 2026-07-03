import { err, fromPromise, ok, Result, tryCatch, tryCatchAsync, tryMap, tryMapAsync, type Result as ResultType } from '../index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

const okResult = ok<number, string>(42);
const errResult = err<string, number>('error');
const unionResult: ResultType<number, string> = Math.random() > 0.5 ? okResult : errResult;

if (okResult.isOk()) {
    const value: number = okResult.value;
    value satisfies number;
}

if (errResult.isErr()) {
    const error: string = errResult.error;
    error satisfies string;
}

// @ts-expect-error Ok results do not expose an impossible Err field.
okResult.error;

// @ts-expect-error Err results do not expose an impossible Ok field.
errResult.value;

// @ts-expect-error Result values must be narrowed before reading the Ok field.
unionResult.value;

// @ts-expect-error Result values must be narrowed before reading the Err field.
unionResult.error;

const throwableParser = Result.fromThrowable(
    (input: string): number => Number.parseInt(input, 10),
    (error): { type: 'parse'; cause: unknown } => ({ type: 'parse', cause: error })
);

type FromThrowablePreservesParametersAndResult = Expect<
    Equal<typeof throwableParser, (input: string) => ResultType<number, { type: 'parse'; cause: unknown }>>
>;

const tryAsyncResult = Result.tryAsync(
    async (): Promise<number> => 1,
    (error): { type: 'async'; cause: unknown } => ({ type: 'async', cause: error })
);

type TryAsyncReturnsPromiseResult = Expect<
    Equal<typeof tryAsyncResult, Promise<ResultType<number, { type: 'async'; cause: unknown }>>>
>;

const namespaceSequence = Result.sequence([
    ok<number, 'number-error'>(1),
    ok<string, 'string-error'>('a'),
] as const);

type ResultNamespaceSequencePreservesTupleValuesAndErrorUnion = Expect<
    Equal<typeof namespaceSequence, ResultType<[number, string], 'number-error' | 'string-error'>>
>;

const namespaceCombined = Result.combine(
    err<'left-error', number>('left-error'),
    ok<string, 'right-error'>('value')
);

type ResultNamespaceCombineCollectsErrorArray = Expect<
    Equal<typeof namespaceCombined, ResultType<[number, string], Array<'left-error' | 'right-error'>>>
>;

// --- errorMapper is required when an explicit error type is supplied (result-ts-7er) ---
// Without a mapper the caught value is passed through unmapped, so claiming a
// typed error without providing a mapper would be a lie the type system allows.

declare const numberPromise: Promise<number>;

// @ts-expect-error fromPromise with an explicit error type must receive an errorMapper.
fromPromise<number, Error>(numberPromise);

const fromPromiseDefault = fromPromise(numberPromise);
type FromPromiseWithoutMapperKeepsUnknownError = Expect<
    Equal<typeof fromPromiseDefault, Promise<ResultType<number, unknown>>>
>;

const fromPromiseMapped = fromPromise(numberPromise, (cause): { type: 'mapped'; cause: unknown } => ({ type: 'mapped', cause }));
type FromPromiseWithMapperUsesMappedError = Expect<
    Equal<typeof fromPromiseMapped, Promise<ResultType<number, { type: 'mapped'; cause: unknown }>>>
>;

// @ts-expect-error tryAsync with an explicit error type must receive an errorMapper.
Result.tryAsync<number, Error>(async () => 1);

const tryAsyncDefault = Result.tryAsync(async (): Promise<number> => 1);
type TryAsyncWithoutMapperKeepsUnknownError = Expect<
    Equal<typeof tryAsyncDefault, Promise<ResultType<number, unknown>>>
>;

// @ts-expect-error fromThrowable with an explicit error type must receive an errorMapper.
Result.fromThrowable<[string], number, Error>((input: string) => input.length);

const fromThrowableDefault = Result.fromThrowable((input: string): number => input.length);
type FromThrowableWithoutMapperKeepsUnknownError = Expect<
    Equal<typeof fromThrowableDefault, (input: string) => ResultType<number, unknown>>
>;

// @ts-expect-error tryCatch with an explicit error type must receive an errorMapper.
tryCatch<number, Error>(() => 1);

const tryCatchMapped = tryCatch(() => 1, (): 'boom' => 'boom')(ok<string, 'src'>('x'));
type TryCatchWithMapperUnionsSourceAndMappedErrors = Expect<
    Equal<typeof tryCatchMapped, ResultType<number, 'src' | 'boom'>>
>;

// @ts-expect-error tryCatchAsync with an explicit error type must receive an errorMapper.
tryCatchAsync<number, Error>(async () => 1);

// @ts-expect-error tryMap with an explicit mapped-error type must receive an errorMapper.
tryMap<number, string, number, Error>(value => value + 1);

const tryMapMapped = ok<number, 'src'>(1).pipe(tryMap(value => value + 1, (): 'boom' => 'boom'));
type TryMapWithMapperUnionsSourceAndMappedErrors = Expect<
    Equal<typeof tryMapMapped, ResultType<number, 'src' | 'boom'>>
>;

// @ts-expect-error tryMapAsync with an explicit mapped-error type must receive an errorMapper.
tryMapAsync<number, string, number, Error>(async value => value + 1);
