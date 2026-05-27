import { err, ok, type Result } from '../index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

class NetworkError extends Error {
    private readonly __networkError!: void;
}

class ValidationError extends Error {
    private readonly __validationError!: void;
}

const result: Result<number, NetworkError | ValidationError> = err(new ValidationError('bad'));

if (!result.isErr()) {
    throw new Error('expected Err');
}

const matched = result
    .match()
    .when(NetworkError, () => 'network' as const)
    .when(ValidationError, () => 'validation' as const)
    .run();

type MatchChainsAllErrorConstructors = Expect<
    Equal<typeof matched, 'network' | 'validation'>
>;

const recovered = result
    .matchErr()
    .when(NetworkError, () => ok(1))
    .when(ValidationError, () => ok(2))
    .run();

type MatchErrRequiresResultHandlers = Expect<
    Equal<typeof recovered, Result<number, never>>
>;

// @ts-expect-error matchErr handlers must return Result explicitly.
result.matchErr().when(NetworkError, () => 1);

// @ts-expect-error matchErr guarded handlers must return Result explicitly.
result.matchErr().whenGuard((error): error is NetworkError => error instanceof NetworkError, () => 1);

// @ts-expect-error matchErr otherwise handlers must return Result explicitly.
result.matchErr().otherwise(() => 1);
