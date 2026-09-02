import {
    err,
    matchTag,
    ok,
    type AsyncErrMatchBuilder,
    type AsyncErrorMatchBuilder,
    type ErrMatchBuilder,
    type ErrorMatchBuilder,
    type Result,
} from '../index';

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

type TaggedError =
    | { readonly type: 'network'; readonly retryAfter: number }
    | { readonly type: 'validation'; readonly field: string };

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

const matchedWithExplicitName = result
    .matchError()
    .when(NetworkError, () => 'network' as const)
    .when(ValidationError, () => 'validation' as const)
    .run();

type MatchErrorChainsAllErrorConstructors = Expect<
    Equal<typeof matchedWithExplicitName, 'network' | 'validation'>
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

const tagged: Result<number, TaggedError> = err({ type: 'network', retryAfter: 30 });

if (!tagged.isErr()) {
    throw new Error('expected Err');
}

const taggedMessage = tagged
    .matchError()
    .whenTag('type', 'network', error => `retry:${error.retryAfter}` as const)
    .whenTag('type', 'validation', error => `field:${error.field}` as const)
    .run();

type MatchErrorNarrowsDiscriminatedUnions = Expect<
    Equal<typeof taggedMessage, `retry:${number}` | `field:${string}`>
>;

const objectTaggedMessage = matchTag(tagged, 'type', {
    network: error => `retry:${error.retryAfter}` as const,
    validation: error => `field:${error.field}` as const,
});

type MatchTagObjectHandlersAreExhaustive = Expect<
    Equal<typeof objectTaggedMessage, `retry:${number}` | `field:${string}`>
>;

// @ts-expect-error matchTag requires a handler for every tag.
matchTag(tagged, 'type', {
    network: error => `retry:${error.retryAfter}` as const,
});

matchTag(tagged, 'type', {
    network: error => {
        const retryAfter: number = error.retryAfter;
        return retryAfter;
    },
    validation: error => {
        const field: string = error.field;
        return field;
    },
});

const taggedRecovery = tagged
    .matchErr()
    .whenTag('type', 'network', error => ok(error.retryAfter))
    .whenTag('type', 'validation', error => err(error))
    .run();

type MatchErrWhenTagPreservesResultTypes = Expect<
    Equal<typeof taggedRecovery, Result<number, { readonly type: 'validation'; readonly field: string }>>
>;

// @ts-expect-error matchErr whenTag handlers must return Result explicitly.
tagged.matchErr().whenTag('type', 'network', error => error.retryAfter);

const asyncTaggedMessage = tagged
    .matchErrorAsync()
    .whenTag('type', 'network', async error => `retry:${error.retryAfter}` as const)
    .whenTag('type', 'validation', async error => `field:${error.field}` as const)
    .run();

type MatchErrorAsyncNarrowsDiscriminatedUnions = Expect<
    Equal<typeof asyncTaggedMessage, Promise<`retry:${number}` | `field:${string}`>>
>;

const asyncTaggedRecovery = tagged
    .matchErrAsync()
    .whenTag('type', 'network', async error => ok(error.retryAfter))
    .whenTag('type', 'validation', async error => err(error))
    .run();

type MatchErrAsyncWhenTagPreservesResultTypes = Expect<
    Equal<typeof asyncTaggedRecovery, Promise<Result<number, { readonly type: 'validation'; readonly field: string }>>>
>;

// @ts-expect-error matchErrAsync handlers must return Result explicitly.
tagged.matchErrAsync().whenTag('type', 'network', async error => error.retryAfter);

const errorBuilder = result.matchError();
const asyncErrorBuilder = result.matchErrorAsync();
const errBuilder = result.matchErr();
const asyncErrBuilder = result.matchErrAsync();

type MatchErrorReturnsTheExportedBuilder = Expect<
    Equal<typeof errorBuilder, ErrorMatchBuilder<NetworkError | ValidationError, never>>
>;

type MatchErrorAsyncReturnsTheExportedBuilder = Expect<
    Equal<typeof asyncErrorBuilder, AsyncErrorMatchBuilder<NetworkError | ValidationError, never>>
>;

type MatchErrReturnsTheExportedBuilder = Expect<
    Equal<typeof errBuilder, ErrMatchBuilder<number, NetworkError | ValidationError, never, never>>
>;

type MatchErrAsyncReturnsTheExportedBuilder = Expect<
    Equal<typeof asyncErrBuilder, AsyncErrMatchBuilder<number, NetworkError | ValidationError, never, never>>
>;

// @ts-expect-error run() requires every distinguishable error class to be handled.
result.matchError().when(NetworkError, () => 'network' as const).run();

class LookalikeNotFound extends Error {}
class LookalikeTimeout extends Error {}

const lookalike: Result<number, LookalikeNotFound | LookalikeTimeout> = err(new LookalikeTimeout('slow'));

if (!lookalike.isErr()) {
    throw new Error('expected Err');
}

// Documented limit: classes of the same shape count as one case, so this compiles
// and rethrows the Timeout at runtime. A distinguishing member per class restores the guard.
lookalike.matchError().when(LookalikeNotFound, () => 'not found' as const).run();
