import { err, flatMap, ok, type Result } from './result';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

const flatMapped = ok<number, 'source-error'>(1).pipe(
    flatMap((value): Result<string, 'mapped-error'> => {
        return value > 0 ? ok<string, 'mapped-error'>('ok') : err<'mapped-error', string>('mapped-error');
    })
);

type FlatMapUnionsSourceAndMappedErrors = Expect<
    Equal<typeof flatMapped, Result<string, 'source-error' | 'mapped-error'>>
>;
