import { fold, foldAsync, type Result } from '../index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

declare const source: Result<number, 'parse'>;

const method = source.fold(value => value, error => error);
const operator = source.pipe(fold({ ok: value => value, err: error => error }));
type FoldMethodReturnsTheUnionOfBothBranches = Expect<Equal<typeof method, number | 'parse'>>;
type FoldOperatorReturnsTheUnionOfBothBranches = Expect<Equal<typeof operator, number | 'parse'>>;

const sameType = source.pipe(fold({ ok: value => value, err: () => 0 }));
type FoldOperatorKeepsASingleTypeForEqualBranches = Expect<Equal<typeof sameType, number>>;

const asyncOperator = source.pipeAsync(foldAsync({ ok: async value => value, err: error => error }));
type FoldAsyncOperatorReturnsTheUnionOfBothBranches = Expect<Equal<typeof asyncOperator, Promise<number | 'parse'>>>;
