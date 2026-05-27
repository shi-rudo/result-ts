import { err, ok, Result, type Result as ResultType } from '../index';

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
