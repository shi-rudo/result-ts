import { err, gen, ok, type Result } from './index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

const generated = gen(function* () {
    const id = yield* ok<number, 'id-error'>(1);
    const name = yield* ok<string, 'name-error'>('alice');
    return String(id) + ':' + name;
});

type GenUnionsYieldedErrors = Expect<
    Equal<typeof generated, Promise<Result<string, 'id-error' | 'name-error'>>>
>;

const generatedReturningResult = gen(function* () {
    yield* ok<number, 'yield-error'>(1);
    return err<'return-error', string>('return-error');
});

type GenUnionsYieldedAndReturnedResultErrors = Expect<
    Equal<typeof generatedReturningResult, Promise<Result<string, 'yield-error' | 'return-error'>>>
>;
