import { describe, expect, it, vi } from 'vitest';

import {
    matchTag,
    type AsyncErrMatchBuilder,
    type AsyncErrorMatchBuilder,
    type ErrorMatchBuilder,
    type ErrMatchBuilder,
} from './matcher';
import { Result, err, ok } from './result';
import { ERR_MATCH_ERR_HANDLER_NOT_RESULT, InvalidResultStateError, MatchErrHandlerNotResultError } from '../errors';

class IOError extends Error { }
class ParseError extends Error { }
class ValidationError extends Error { }
class UnknownError extends Error { }

type TaggedError =
    | { readonly type: 'network'; readonly retryAfter: number }
    | { readonly type: 'validation'; readonly field: string };

describe('Result.match()', () => {
    it('supports matchError() as explicit Err-only matcher name', () => {
        const result: Result<number, IOError | ValidationError> = Result.err(new IOError('io'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchError()
            .when(IOError, error => `io:${error.message}`)
            .when(ValidationError, error => `validation:${error.message}`)
            .run();

        expect(message).toBe('io:io');
    });

    it('names matchError() in the Ok-state error message', () => {
        expect(() => ok<number, Error>(1).matchError()).toThrow('matchError() can only be called on Err results');
    });

    it('is exhaustive with run() (E becomes never)', () => {
        const result: Result<number, IOError | ParseError | ValidationError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .match()
            .when(IOError, () => 'Please check if the config file exists and is readable')
            .when(ParseError, () => 'Please check if the config file contains valid JSON')
            .when(ValidationError, error => `Invalid config: ${error.message}`)
            .run();

        expect(message).toBe('Invalid config: bad');
    });

    it('supports otherwise() for non-exhaustive matches', () => {
        const result: Result<number, IOError | ParseError | ValidationError | UnknownError> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .match()
            .when(IOError, () => 'io')
            .when(ParseError, () => 'parse')
            .when(ValidationError, e => `invalid: ${e.message}`)
            .otherwise(e => `unexpected: ${e.message}`);

        expect(message).toBe('unexpected: nope');
    });

    it('supports whenGuard and does not call otherwise', () => {
        const result: Result<number, Error> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const guard = vi.fn((error: Error): error is ValidationError => error instanceof ValidationError);
        const handler = vi.fn((error: ValidationError) => `invalid:${error.message}`);
        const otherwise = vi.fn((error: Error) => `fallback:${error.message}`);

        const message = result.match().whenGuard(guard, handler).otherwise(otherwise);

        expect(guard).toHaveBeenCalledWith(result.error);
        expect(handler).toHaveBeenCalled();
        expect(otherwise).not.toHaveBeenCalled();
        expect(message).toBe('invalid:bad');
    });

    it('supports whenTag for discriminated union errors', () => {
        const result: Result<number, TaggedError> = Result.err({ type: 'validation', field: 'email' });

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchError()
            .whenTag('type', 'network', error => `retry:${error.retryAfter}`)
            .whenTag('type', 'validation', error => `field:${error.field}`)
            .run();

        expect(message).toBe('field:email');
    });

    it('supports exhaustive object matching for discriminated union errors', () => {
        const result: Result<number, TaggedError> = Result.err({ type: 'network', retryAfter: 30 });

        const message = matchTag(result, 'type', {
            network: error => `retry:${error.retryAfter}`,
            validation: error => `field:${error.field}`,
        });

        expect(message).toBe('retry:30');
    });

    it('throws when object matching is called on Ok', () => {
        expect(() => matchTag(ok<number, TaggedError>(1), 'type', {
            network: error => `retry:${error.retryAfter}`,
            validation: error => `field:${error.field}`,
        })).toThrow('matchTag() can only be called on Err results');
    });

    it('throws when object matching has no runtime handler for the tag', () => {
        const result: Result<number, TaggedError> = Result.err({ type: 'network', retryAfter: 30 });

        expect(() => matchTag(result, 'type', {
            validation: error => `field:${error.field}`,
        } as never)).toThrow(InvalidResultStateError);
    });

    it('throws when object matching receives a malformed Result-like state', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, TaggedError>;

        expect(() => matchTag(malformed, 'type', {
            network: error => `retry:${error.retryAfter}`,
            validation: error => `field:${error.field}`,
        })).toThrow(InvalidResultStateError);
    });

    it('falls through non-matching guards and tags to otherwise()', () => {
        const result: Result<number, IOError | TaggedError> = Result.err({ type: 'network', retryAfter: 30 });

        if (!result.isErr()) throw new Error('expected Err');

        const guard = vi.fn((error: IOError | TaggedError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(() => 'guarded');
        const tagged = vi.fn(() => 'tagged');

        const message = result
            .matchError()
            .whenGuard(guard, guarded)
            .whenTag('type', 'validation', tagged)
            .otherwise(error => `fallback:${String('type' in error ? error.type : error.message)}`);

        expect(guard).toHaveBeenCalledWith(result.error);
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).not.toHaveBeenCalled();
        expect(message).toBe('fallback:network');
    });

    it('skips further when-calls after first match', () => {
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const first = vi.fn(() => 'first');
        const second = vi.fn(() => 'second');

        const message = result
            .match()
            .when(ValidationError, first)
            .when(ValidationError, second)
            .otherwise(() => 'fallback');

        expect(first).toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();
        expect(message).toBe('first');
    });

    it('skips guarded and tagged handlers after first match', () => {
        const result: Result<number, ValidationError | TaggedError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const guard = vi.fn((error: ValidationError | TaggedError): error is ValidationError => error instanceof ValidationError);
        const guarded = vi.fn(() => 'guarded');
        const tagged = vi.fn(() => 'tagged');

        const message = result
            .match()
            .when(ValidationError, () => 'first')
            .whenGuard(guard, guarded)
            .whenTag('type', 'network', tagged)
            .otherwise(() => 'fallback');

        expect(guard).not.toHaveBeenCalled();
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).not.toHaveBeenCalled();
        expect(message).toBe('first');
    });

    it('run() throws if no match is present', () => {
        const result: Result<number, Error> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const builder = result.match().when(IOError, () => 'io');

        const run = () => (builder as unknown as ErrorMatchBuilder<never, string>).run();

        expect(run).toThrow(UnknownError);
    });

    it('throws InvalidResultStateError for malformed Result state', () => {
        const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, Error>;

        expect(() => Result.err<Error, number>(new UnknownError('nope')).match.call(malformed)).toThrow(InvalidResultStateError);
    });
});

describe('Result.matchErr()', () => {
    it('returns explicit Result instances from handlers', () => {
        const result: Result<number, IOError | ParseError | ValidationError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErr()
            .when(IOError, () => ok(1))
            .when(ParseError, () => ok(2))
            .when(ValidationError, e => err(new ValidationError(`Invalid config: ${e.message}`)))
            .otherwise(e => err(new UnknownError(`Unexpected error: ${String(e)}`)));

        const _type: Result<number, ValidationError | UnknownError> = out;

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            const value: number = out.value;
            expect(value).toBe(2);
        }
    });

    it('does not call otherwise when Source is Ok', () => {
        const result: Result<number, IOError | ParseError> = ok<number, IOError | ParseError>(1);
        const otherwise = vi.fn(() => new UnknownError('nope'));

        const out = result.matchErr().when(IOError, () => ok(2)).otherwise(otherwise);

        expect(otherwise).toHaveBeenCalledTimes(0);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(1);
        }
    });

    it('throws when a handler returns a non-Result value', () => {
        const result: Result<number, ParseError> = Result.err(new ParseError('parse'));
        const otherwise = vi.fn(() => ok(0));

        const out = () => result
            .matchErr()
            .when(ParseError, () => new ValidationError('bad') as never)
            .otherwise(otherwise);

        let caughtError: unknown;
        try {
            out();
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(MatchErrHandlerNotResultError);
        expect((caughtError as MatchErrHandlerNotResultError).code).toBe(ERR_MATCH_ERR_HANDLER_NOT_RESULT);
        expect((caughtError as MatchErrHandlerNotResultError).handlerName).toBe('when');
        expect(otherwise).not.toHaveBeenCalled();
    });

    it('returns Result instances from handlers unchanged', () => {
        const result: Result<number, ParseError> = Result.err(new ParseError('parse'));
        const expected = ok(2);

        const out = result
            .matchErr()
            .when(ParseError, () => expected)
            .otherwise(() => ok(0));

        expect(out).toBe(expected);
    });

    it('throws when a guarded handler returns a non-Result value', () => {
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));
        const guard = vi.fn((error: Error): error is ValidationError => error instanceof ValidationError);

        const out = () => result
            .matchErr()
            .whenGuard(guard, () => new UnknownError('mapped') as never)
            .otherwise(() => ok(0));

        let caughtError: unknown;
        try {
            out();
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(MatchErrHandlerNotResultError);
        expect((caughtError as MatchErrHandlerNotResultError).code).toBe(ERR_MATCH_ERR_HANDLER_NOT_RESULT);
        expect((caughtError as MatchErrHandlerNotResultError).handlerName).toBe('whenGuard');
        expect(guard).toHaveBeenCalled();
    });

    it('supports whenTag for discriminated union errors', () => {
        const result: Result<number, TaggedError> = Result.err({ type: 'network', retryAfter: 30 });

        const out = result
            .matchErr()
            .whenTag('type', 'network', error => ok(error.retryAfter))
            .whenTag('type', 'validation', error => err(error))
            .run();

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(30);
        }
    });

    it('skips whenGuard when Source is Ok', () => {
        const result = ok<number, ValidationError>(1);
        const guard = vi.fn((error: ValidationError): error is ValidationError => error instanceof ValidationError);
        const handler = vi.fn(() => ok(2));

        const out = result
            .matchErr()
            .whenGuard(guard, handler)
            .otherwise(() => ok(0));

        expect(guard).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(1);
        }
    });

    it('throws when otherwise returns a non-Result value', () => {
        const result: Result<number, ParseError> = Result.err(new ParseError('parse'));

        const out = () => result
            .matchErr()
            .when(IOError, () => ok(1))
            .otherwise(() => new UnknownError('nope') as never);

        let caughtError: unknown;
        try {
            out();
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(MatchErrHandlerNotResultError);
        expect((caughtError as MatchErrHandlerNotResultError).code).toBe(ERR_MATCH_ERR_HANDLER_NOT_RESULT);
        expect((caughtError as MatchErrHandlerNotResultError).handlerName).toBe('otherwise');
    });

    it('throws for structurally similar handler output', () => {
        const imposter = { isOk: () => true, isErr: () => false, value: 123 };
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));

        const out = () => result.matchErr().otherwise(() => imposter as never);

        expect(out).toThrow(MatchErrHandlerNotResultError);
    });

    it('run() returns Ok if Source Ok and E = never', () => {
        const result = ok<number, never>(1);
        const out = result.matchErr().run();

        expect(out).toBe(result);
    });

    it('run() throws if no resolution is present', () => {
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));

        const builder = result
            .matchErr()
            .when(IOError, () => ok(1));

        const run = () => (builder as unknown as ErrMatchBuilder<number, never, never, never>).run();

        expect(run).toThrow(ValidationError);
    });

    it('falls through non-matching guarded and tagged handlers to otherwise()', () => {
        const result: Result<number, TaggedError | IOError> = Result.err({ type: 'network', retryAfter: 30 });
        const guard = vi.fn((error: TaggedError | IOError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(() => ok(1));
        const tagged = vi.fn(() => ok(2));

        const out = result
            .matchErr()
            .whenGuard(guard, guarded)
            .whenTag('type', 'validation', tagged)
            .otherwise(error => ok('type' in error ? error.retryAfter : 0));

        expect(guard).toHaveBeenCalledWith(result.isErr() ? result.error : undefined);
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).not.toHaveBeenCalled();
        expect(out).toEqual(ok(30));
    });

    it('throws for malformed Result state during construction', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, Error>;

        expect(() => ok<number, Error>(0).matchErr.call(malformed)).toThrow(InvalidResultStateError);
    });
});

describe('Result.matchErrorAsync()', () => {
    it('supports async handlers for Err-only matching', async () => {
        const result: Result<number, IOError | ValidationError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = await result
            .matchErrorAsync()
            .when(IOError, async error => `io:${error.message}`)
            .when(ValidationError, async error => `validation:${error.message}`)
            .run();

        expect(message).toBe('validation:bad');
    });

    it('names matchErrorAsync() in the Ok-state error message', () => {
        expect(() => ok<number, Error>(1).matchErrorAsync()).toThrow('matchErrorAsync() can only be called on Err results');
    });

    it('supports async guard and tag handlers with otherwise fallback', async () => {
        const result: Result<number, IOError | TaggedError> = Result.err({ type: 'validation', field: 'email' });

        if (!result.isErr()) throw new Error('expected Err');

        const guard = vi.fn((error: IOError | TaggedError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(async () => 'guarded');
        const tagged = vi.fn(async (error: Extract<TaggedError, { type: 'validation' }>) => `tag:${error.field}`);
        const otherwise = vi.fn(async () => 'fallback');

        const message = await result
            .matchErrorAsync()
            .whenGuard(guard, guarded)
            .whenTag('type', 'validation', tagged)
            .otherwise(otherwise);

        expect(guard).toHaveBeenCalledWith(result.error);
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).toHaveBeenCalledWith(result.error);
        expect(otherwise).not.toHaveBeenCalled();
        expect(message).toBe('tag:email');
    });

    it('supports matching async guarded handlers', async () => {
        const result: Result<number, IOError | ValidationError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = await result
            .matchErrorAsync()
            .whenGuard(
                (error): error is ValidationError => error instanceof ValidationError,
                async error => `guard:${error.message}`
            )
            .run();

        expect(message).toBe('guard:bad');
    });

    it('skips async guard and tag handlers after a prior match', async () => {
        const result: Result<number, IOError | TaggedError> = Result.err(new IOError('io'));

        if (!result.isErr()) throw new Error('expected Err');

        const guard = vi.fn((error: IOError | TaggedError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(async () => 'guarded');
        const tagged = vi.fn(async () => 'tagged');

        const message = await result
            .matchErrorAsync()
            .when(IOError, async () => 'first')
            .when(ValidationError, async () => 'second')
            .whenGuard(guard, guarded)
            .whenTag('type', 'network', tagged)
            .otherwise(async () => 'fallback');

        expect(guard).not.toHaveBeenCalled();
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).not.toHaveBeenCalled();
        expect(message).toBe('first');
    });

    it('uses async otherwise when no handler matches', async () => {
        const result: Result<number, IOError | ValidationError> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = await result
            .matchErrorAsync()
            .when(IOError, async () => 'io')
            .whenGuard((error): error is ValidationError => error instanceof ValidationError, async () => 'validation')
            .whenTag('type', 'network', async () => 'tag')
            .otherwise(async error => `fallback:${error.message}`);

        expect(message).toBe('fallback:nope');
    });

    it('run() throws asynchronously if no match is present', async () => {
        const result: Result<number, IOError | UnknownError> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const builder = result.matchErrorAsync().when(IOError, async () => 'io');

        await expect((builder as unknown as AsyncErrorMatchBuilder<never, string>).run()).rejects.toThrow(UnknownError);
    });
});

describe('Result.matchErrAsync()', () => {
    it('supports async Result-returning handlers', async () => {
        const result: Result<number, IOError | ValidationError> = Result.err(new IOError('io'));

        const out = await result
            .matchErrAsync()
            .when(IOError, async () => ok(42))
            .when(ValidationError, async error => err(error))
            .run();

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(42);
        }
    });

    it('does not call async otherwise when source is Ok', async () => {
        const result: Result<number, IOError | ValidationError> = ok(1);
        const otherwise = vi.fn(async () => ok(2));

        const out = await result
            .matchErrAsync()
            .when(IOError, async () => ok(3))
            .otherwise(otherwise);

        expect(otherwise).not.toHaveBeenCalled();
        expect(out).toBe(result);
    });

    it('supports async whenGuard and whenTag fallthrough', async () => {
        const result: Result<number, TaggedError | IOError> = Result.err({ type: 'validation', field: 'email' });
        const guard = vi.fn((error: TaggedError | IOError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(async () => ok(1));
        const tagged = vi.fn(async (error: Extract<TaggedError, { type: 'validation' }>) => ok(error.field.length));

        const out = await result
            .matchErrAsync()
            .whenGuard(guard, guarded)
            .whenTag('type', 'network', async error => ok(error.retryAfter))
            .whenTag('type', 'validation', tagged)
            .run();

        expect(guard).toHaveBeenCalledWith(result.error);
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).toHaveBeenCalledWith(result.error);
        expect(out).toEqual(ok(5));
    });

    it('skips async guarded and tagged Result handlers after source is already resolved', async () => {
        const result: Result<number, TaggedError | IOError> = ok(1);
        const guard = vi.fn((error: TaggedError | IOError): error is IOError => error instanceof IOError);
        const guarded = vi.fn(async () => ok(2));
        const tagged = vi.fn(async () => ok(3));

        const out = await result
            .matchErrAsync()
            .whenGuard(guard, guarded)
            .whenTag('type', 'network', tagged)
            .run();

        expect(guard).not.toHaveBeenCalled();
        expect(guarded).not.toHaveBeenCalled();
        expect(tagged).not.toHaveBeenCalled();
        expect(out).toBe(result);
    });

    it('throws when async when handler returns a non-Result value', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));

        await expect(
            result.matchErrAsync().when(IOError, async () => 123 as never).run()
        ).rejects.toMatchObject({
            code: ERR_MATCH_ERR_HANDLER_NOT_RESULT,
            handlerName: 'when',
            returnedValue: 123,
        });
    });

    it('throws when async whenGuard handler returns a non-Result value', async () => {
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));

        await expect(
            result
                .matchErrAsync()
                .whenGuard(
                    (error): error is ValidationError => error instanceof ValidationError,
                    async () => 'not result' as never
                )
                .run()
        ).rejects.toMatchObject({
            code: ERR_MATCH_ERR_HANDLER_NOT_RESULT,
            handlerName: 'whenGuard',
            returnedValue: 'not result',
        });
    });

    it('throws when async whenTag handler returns a non-Result value', async () => {
        const result: Result<number, TaggedError> = Result.err({ type: 'network', retryAfter: 30 });

        await expect(
            result
                .matchErrAsync()
                .whenTag('type', 'network', async () => 'not result' as never)
                .run()
        ).rejects.toMatchObject({
            code: ERR_MATCH_ERR_HANDLER_NOT_RESULT,
            handlerName: 'whenTag',
            returnedValue: 'not result',
        });
    });

    it('throws when async otherwise returns a non-Result value', async () => {
        const result: Result<number, UnknownError> = Result.err(new UnknownError('nope'));

        await expect(
            result.matchErrAsync().otherwise(async () => 123 as never)
        ).rejects.toMatchObject({
            code: ERR_MATCH_ERR_HANDLER_NOT_RESULT,
            handlerName: 'otherwise',
            returnedValue: 123,
        });
    });

    it('run() throws asynchronously if no resolution is present', async () => {
        const result: Result<number, UnknownError> = Result.err(new UnknownError('nope'));

        const builder = result.matchErrAsync().when(IOError, async () => ok(1));

        await expect((builder as unknown as AsyncErrMatchBuilder<number, never, never, never>).run()).rejects.toThrow(UnknownError);
    });

    it('throws for malformed Result state during construction', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, Error>;

        expect(() => ok<number, Error>(0).matchErrAsync.call(malformed)).toThrow(InvalidResultStateError);
    });
});

describe('Async matcher laziness (regression: unhandled rejection on abandoned chains)', () => {
    const drainMicrotasks = async (): Promise<void> => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
    };

    it('matchErrorAsync: does not invoke the handler before the chain is consumed', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));
        if (!result.isErr()) throw new Error('expected Err');

        const handler = vi.fn(async () => 'io');
        // Chain is built but intentionally never consumed via run()/otherwise().
        result.matchErrorAsync().when(IOError, handler);

        await drainMicrotasks();
        expect(handler).not.toHaveBeenCalled();
    });

    it('matchErrorAsync: a rejecting handler on an abandoned chain causes no unhandled rejection', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));
        if (!result.isErr()) throw new Error('expected Err');

        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        result.matchErrorAsync().when(IOError, async () => {
            throw new Error('handler rejected');
        });

        await drainMicrotasks();
        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('matchErrorAsync: invokes the handler once even when run() is awaited twice', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));
        if (!result.isErr()) throw new Error('expected Err');

        const handler = vi.fn(async () => 'io');
        const builder = result
            .matchErrorAsync()
            .when(IOError, handler) as unknown as AsyncErrorMatchBuilder<never, string>;

        expect(await builder.run()).toBe('io');
        expect(await builder.run()).toBe('io');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matchErrAsync: does not invoke the handler before the chain is consumed', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));

        const handler = vi.fn(async () => ok(1));
        result.matchErrAsync().when(IOError, handler);

        await drainMicrotasks();
        expect(handler).not.toHaveBeenCalled();
    });

    it('matchErrAsync: a rejecting handler on an abandoned chain causes no unhandled rejection', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));

        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        result.matchErrAsync().when(IOError, async () => {
            throw new Error('handler rejected');
        });

        await drainMicrotasks();
        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('matchErrAsync: invokes the handler once even when run() is awaited twice', async () => {
        const result: Result<number, IOError> = Result.err(new IOError('io'));

        const handler = vi.fn(async () => ok(1));
        const builder = result
            .matchErrAsync()
            .when(IOError, handler) as unknown as AsyncErrMatchBuilder<number, never, number, never>;

        expect((await builder.run()).unwrapOr(0)).toBe(1);
        expect((await builder.run()).unwrapOr(0)).toBe(1);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matchErrAsync: Ok results still pass through untouched', async () => {
        const result: Result<number, IOError> = ok(42);

        const out = await result
            .matchErrAsync()
            .when(IOError, async () => ok(0))
            .run();

        expect(out.unwrapOr(0)).toBe(42);
    });
});
