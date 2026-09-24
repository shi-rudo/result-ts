import {
    err,
    matchTag,
    ok,
    type AsyncErrorMatchBuilder,
    type AsyncErrorToResultMatchBuilder,
    type ErrorMatchBuilder,
    type ErrorToResultMatchBuilder,
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
    .matchError()
    .when(NetworkError, () => 'network' as const)
    .when(ValidationError, () => 'validation' as const)
    .run();

type MatchErrorChainsAllErrorConstructors = Expect<
    Equal<typeof matched, 'network' | 'validation'>
>;

const recovered = result
    .matchErrorToResult()
    .when(NetworkError, () => ok(1))
    .when(ValidationError, () => ok(2))
    .run();

type MatchErrRequiresResultHandlers = Expect<
    Equal<typeof recovered, Result<number, never>>
>;

// @ts-expect-error matchErrorToResult handlers must return Result explicitly.
result.matchErrorToResult().when(NetworkError, () => 1);

// @ts-expect-error matchErrorToResult guarded handlers must return Result explicitly.
result.matchErrorToResult().whenGuard((error): error is NetworkError => error instanceof NetworkError, () => 1);

// @ts-expect-error matchErrorToResult otherwise handlers must return Result explicitly.
result.matchErrorToResult().otherwise(() => 1);

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
    .matchErrorToResult()
    .whenTag('type', 'network', error => ok(error.retryAfter))
    .whenTag('type', 'validation', error => err(error))
    .run();

type MatchErrWhenTagPreservesResultTypes = Expect<
    Equal<typeof taggedRecovery, Result<number, { readonly type: 'validation'; readonly field: string }>>
>;

// @ts-expect-error matchErrorToResult whenTag handlers must return Result explicitly.
tagged.matchErrorToResult().whenTag('type', 'network', error => error.retryAfter);

const asyncTaggedMessage = tagged
    .matchErrorAsync()
    .whenTag('type', 'network', async error => `retry:${error.retryAfter}` as const)
    .whenTag('type', 'validation', async error => `field:${error.field}` as const)
    .run();

type MatchErrorAsyncNarrowsDiscriminatedUnions = Expect<
    Equal<typeof asyncTaggedMessage, Promise<`retry:${number}` | `field:${string}`>>
>;

const asyncTaggedRecovery = tagged
    .matchErrorToResultAsync()
    .whenTag('type', 'network', async error => ok(error.retryAfter))
    .whenTag('type', 'validation', async error => err(error))
    .run();

type MatchErrAsyncWhenTagPreservesResultTypes = Expect<
    Equal<typeof asyncTaggedRecovery, Promise<Result<number, { readonly type: 'validation'; readonly field: string }>>>
>;

// @ts-expect-error matchErrorToResultAsync handlers must return Result explicitly.
tagged.matchErrorToResultAsync().whenTag('type', 'network', async error => error.retryAfter);

const errorBuilder = result.matchError();
const asyncErrorBuilder = result.matchErrorAsync();
const errBuilder = result.matchErrorToResult();
const asyncErrBuilder = result.matchErrorToResultAsync();

type MatchErrorReturnsTheExportedBuilder = Expect<
    Equal<typeof errorBuilder, ErrorMatchBuilder<NetworkError | ValidationError, never>>
>;

type MatchErrorAsyncReturnsTheExportedBuilder = Expect<
    Equal<typeof asyncErrorBuilder, AsyncErrorMatchBuilder<NetworkError | ValidationError, never>>
>;

type MatchErrReturnsTheExportedBuilder = Expect<
    Equal<typeof errBuilder, ErrorToResultMatchBuilder<number, NetworkError | ValidationError, never, never>>
>;

type MatchErrAsyncReturnsTheExportedBuilder = Expect<
    Equal<typeof asyncErrBuilder, AsyncErrorToResultMatchBuilder<number, NetworkError | ValidationError, never, never>>
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
