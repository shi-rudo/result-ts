import { err, flatMap, flatMapAsync, ok, type Result } from './result';

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

const flatMappedAsync = ok<number, 'source-error'>(1).pipeAsync(
    flatMapAsync(async (value): Promise<Result<string, 'mapped-error'>> => {
        return value > 0 ? ok<string, 'mapped-error'>('ok') : err<'mapped-error', string>('mapped-error');
    })
);

type FlatMapAsyncUnionsSourceAndMappedErrors = Expect<
    Equal<typeof flatMappedAsync, Promise<Result<string, 'source-error' | 'mapped-error'>>>
>;
