import { describe, expect, it, vi } from 'vitest';

import type { ErrorMatchBuilder, ErrMatchBuilder } from './matcher';
import { Result, ok } from './result';

class IOError extends Error { }
class ParseError extends Error { }
class ValidationError extends Error { }
class UnknownError extends Error { }

describe('Result.match()', () => {
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

    it('run() throws if no match is present', () => {
        const result: Result<number, Error> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const builder = result.match().when(IOError, () => 'io');

        const run = () => (builder as unknown as ErrorMatchBuilder<never, string>).run();

        expect(run).toThrow(UnknownError);
    });
});

describe('Result.matchErr()', () => {
    it('returns Result and wraps error values automatically', () => {
        const result: Result<number, IOError | ParseError | ValidationError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErr()
            .when(IOError, () => ok(1))
            .when(ParseError, () => ok(2))
            .when(ValidationError, e => new ValidationError(`Invalid config: ${e.message}`))
            .otherwise(e => new UnknownError(`Unexpected error: ${String(e)}`));

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

    it('wraps non-Result handler returns to Err', () => {
        const result: Result<number, ParseError> = Result.err(new ParseError('parse'));
        const otherwise = vi.fn(() => ok(0));

        const out = result
            .matchErr()
            .when(ParseError, () => new ValidationError('bad'))
            .otherwise(otherwise);

        expect(otherwise).not.toHaveBeenCalled();
        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBeInstanceOf(ValidationError);
        }
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

    it('supports whenGuard and wraps error values', () => {
        const result: Result<number, ValidationError> = Result.err(new ValidationError('bad'));
        const guard = vi.fn((error: Error): error is ValidationError => error instanceof ValidationError);

        const out = result
            .matchErr()
            .whenGuard(guard, () => new UnknownError('mapped'))
            .otherwise(() => ok(0));

        expect(guard).toHaveBeenCalled();
        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBeInstanceOf(UnknownError);
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

    it('wraps otherwise-Error if no match is present', () => {
        const result: Result<number, ParseError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErr()
            .when(IOError, () => ok(1))
            .otherwise(() => new UnknownError('nope'));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBeInstanceOf(UnknownError);
        }
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
});
