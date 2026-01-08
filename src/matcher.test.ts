import { describe, expect, it, vi } from 'vitest';

import type { ResultMatchBuilder } from './matcher';
import { ErrMatchBuilder, ResultMatchBuilder as ResultMatchBuilderClass } from './matcher';
import { Result, ok } from './index';

class IOError extends Error { }
class ParseError extends Error { }
class ValidationError extends Error { }
class UnknownError extends Error { }

describe('Result.match()', () => {
    it('is exhaustive with run() (E becomes never)', () => {
        const result: Result<number, IOError | ParseError | ValidationError> = Result.err(new ValidationError('bad'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .when(IOError, () => 'Please check if the config file exists and is readable')
            .when(ParseError, () => 'Please check if the config file contains valid JSON')
            .when(ValidationError, (error) => `Invalid config: ${error.message}`)
            .run();

        expect(message).toBe('Invalid config: bad');
    });

    it('supports otherwise() for non-exhaustive matches', () => {
        const result: Result<number, IOError | ParseError | ValidationError | UnknownError> = Result.err(new UnknownError('nope'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .when(IOError, () => 'io')
            .when(ParseError, () => 'parse')
            .when(ValidationError, (e) => `invalid: ${e.message}`)
            // Note: Error classes are structurally identical in TypeScript, so Exclude doesn't work perfectly
            .otherwise((e: UnknownError) => `unexpected: ${e.message}`);

        expect(message).toBe('unexpected: nope');
    });

    it('supports whenGuard() with type guard', () => {
        class NetworkError extends Error {
            constructor(message: string, public readonly code: number) {
                super(message);
            }
        }

        class DatabaseError extends Error {
            constructor(message: string, public readonly query: string) {
                super(message);
            }
        }

        type AppError = NetworkError | DatabaseError | string;

        const isNetworkError = (e: AppError): e is NetworkError => e instanceof NetworkError;
        const isDatabaseError = (e: AppError): e is DatabaseError => e instanceof DatabaseError;

        const result: Result<number, AppError> = Result.err(new NetworkError('timeout', 408));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .whenGuard(isNetworkError, (e) => `Network error ${e.code}: ${e.message}`)
            .whenGuard(isDatabaseError, (e) => `DB error in query "${e.query}": ${e.message}`)
            .otherwise((e) => `Unknown error: ${String(e)}`);

        expect(message).toBe('Network error 408: timeout');
    });

    it('whenGuard() returns early if already matched', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new IOError('io'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .when(IOError, () => 'matched io')
            .whenGuard((e): e is ParseError => e instanceof ParseError, () => 'matched parse')
            .run();

        expect(message).toBe('matched io');
    });

    it('whenGuard() continues chain if guard returns false', () => {
        class CustomError extends Error {
            constructor(message: string, public readonly tag: 'custom') {
                super(message);
                this.tag = 'custom';
            }
        }

        type AppError = CustomError | ParseError;

        const isCustomError = (e: AppError): e is CustomError => e instanceof CustomError && e.tag === 'custom';

        const result: Result<number, AppError> = Result.err(new ParseError('parse'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .whenGuard(isCustomError, () => 'custom')
            .when(ParseError, () => 'parse')
            .run();

        expect(message).toBe('parse');
    });

    it('run() throws error when no match is found', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new ParseError('parse'));

        if (!result.isErr()) throw new Error('expected Err');

        const builder = result.matchErr().when(IOError, () => 'io');
        // @ts-expect-error - run() requires all error cases to be handled
        expect(() => builder.run()).toThrow(ParseError);
    });
});

describe('Result.matchErr()', () => {
    it('returns Result and auto-wraps error values', () => {
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

    it('does not call otherwise when source is Ok', () => {
        const result: Result<number, IOError | ParseError> = ok<number, IOError | ParseError>(1);
        const otherwise = vi.fn(() => new UnknownError('nope'));

        // matchErr() can only be called on Err results, so we use matchErrResult() instead
        const out = result.matchErrResult().when(IOError, () => ok(2)).otherwise(otherwise);

        expect(otherwise).toHaveBeenCalledTimes(0);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(1);
        }
    });

    it('supports whenGuard() with type guard', () => {
        class NetworkError extends Error {
            constructor(message: string, public readonly code: number) {
                super(message);
            }
        }

        class DatabaseError extends Error {
            constructor(message: string, public readonly query: string) {
                super(message);
            }
        }

        type AppError = NetworkError | DatabaseError | string;

        const isNetworkError = (e: AppError): e is NetworkError => e instanceof NetworkError;
        const isDatabaseError = (e: AppError): e is DatabaseError => e instanceof DatabaseError;

        const result: Result<number, AppError> = Result.err(new NetworkError('timeout', 408));

        const out = result
            .matchErr()
            .whenGuard(isNetworkError, (e) => ok(`Network error ${e.code}: ${e.message}`))
            .whenGuard(isDatabaseError, (e) => ok(`DB error in query "${e.query}": ${e.message}`))
            .otherwise((e) => new UnknownError(`Unknown error: ${String(e)}`));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe('Network error 408: timeout');
        }
    });

    it('whenGuard() auto-wraps non-Result return values', () => {
        class CustomError extends Error {
            constructor(message: string, public readonly code: string) {
                super(message);
            }
        }

        type AppError = CustomError | ParseError;

        const isCustomError = (e: AppError): e is CustomError => e instanceof CustomError && typeof e.code === 'string';

        const result: Result<number, AppError> = Result.err(new CustomError('custom', 'ERR001'));

        const out = result
            .matchErrResult()
            .whenGuard(isCustomError, (e) => new ValidationError(`Code ${e.code}: ${e.message}`))
            .when(ParseError, () => ok(42))
            .otherwise(() => new UnknownError('unknown'));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBeInstanceOf(ValidationError);
            expect(out.error.message).toBe('Code ERR001: custom');
        }
    });

    it('when() auto-wraps non-Result return values in matchErr', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new IOError('io'));

        const out = result
            .matchErrResult()
            .when(IOError, () => 'io error string')
            .when(ParseError, () => ok(42))
            .otherwise(() => new UnknownError('unknown'));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBe('io error string');
        }
    });

    it('otherwise() auto-wraps non-Result return values in matchErr', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErrResult()
            .when(IOError, () => ok(1))
            .otherwise(() => 'fallback string');

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBe('fallback string');
        }
    });

    it('whenGuard() returns early if already resolved', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new IOError('io'));

        const out = result
            .matchErr()
            .when(IOError, () => ok(1))
            .whenGuard((e): e is ParseError => e instanceof ParseError, () => ok(2))
            .otherwise(() => new UnknownError('unknown'));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(1);
        }
    });

    it('whenGuard() continues chain if guard returns false', () => {
        class TaggedError extends Error {
            constructor(message: string, public readonly tag: 'tagged') {
                super(message);
                this.tag = 'tagged';
            }
        }

        type AppError = TaggedError | ParseError;

        const isTaggedError = (e: AppError): e is TaggedError => e instanceof TaggedError && e.tag === 'tagged';

        const result: Result<number, AppError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErr()
            .whenGuard(isTaggedError, () => ok(1))
            .when(ParseError, () => ok(2))
            .otherwise(() => new UnknownError('unknown'));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(2);
        }
    });

    it('run() throws error when not all cases are handled', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new ParseError('parse'));

        const builder = result.matchErr().when(IOError, () => ok(1));
        // @ts-expect-error - run() requires all error cases to be handled
        expect(() => builder.run()).toThrow(ParseError);
    });

    it('fromResult() throws error when Result is neither Ok nor Err (unreachable case)', () => {
        // Create a malformed Result object that bypasses type checking
        const malformedResult = {
            isOk: () => false,
            isErr: () => false,
            value: undefined,
            error: undefined,
        } as unknown as Result<number, string>;

        const makeErr = (e: unknown) => Result.err(e);

        expect(() => {
            ErrMatchBuilder.fromResult(malformedResult, makeErr);
        }).toThrow('Unreachable: Result is neither Ok nor Err');
    });

    it('otherwise() returns Result when handler returns Result', () => {
        const result: Result<number, IOError | ParseError> = Result.err(new ParseError('parse'));

        const out = result
            .matchErr()
            .when(IOError, () => ok(1))
            .otherwise(() => ok(42));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(42);
        }
    });
});

describe('Result.match()', () => {
    it('is lazy: does not evaluate err matcher for Ok', () => {
        const hasInstanceSpy = vi.fn(() => false);

        class SpyError {
            static [Symbol.hasInstance](value: unknown) {
                // @ts-expect-error - Symbol.hasInstance does receive a parameter at runtime, but TS types say it doesn't
                hasInstanceSpy(value);
                return false;
            }
        }

        const out = ok<number, SpyError | 'CODE'>(1)
            .match()
            .err(SpyError, () => 'err')
            .errVal('CODE', () => 'code')
            .ok(value => value + 1)
            .run();

        expect(out).toBe(2);
        expect(hasInstanceSpy).toHaveBeenCalledTimes(0);
    });

    it('matches errVal + err(Ctor) and only runs ok() for Ok', () => {
        class CodeError extends Error { }
        const okHandler = vi.fn((value: number) => `ok:${value}`);

        const out = Result.err<CodeError | 'CODE', number>(new CodeError('boom'))
            .match()
            .errVal('CODE', e => `code:${e}`)
            .err(CodeError, e => {
                const _type: CodeError = e;
                return e.message;
            })
            .ok(okHandler)
            .run();

        expect(out).toBe('boom');
        expect(okHandler).toHaveBeenCalledTimes(0);
    });

    it('narrows E for errVal(literal)', () => {
        const result = Result.err<'A' | 'B', number>('A');

        const builder = result.match().errVal('A', e => e);
        const _type: ResultMatchBuilder<number, 'B', 'A'> = builder;

        const out = builder.ok(value => value).run();
        expect(out).toBe('A');
    });

    it('works with many error types (10+)', () => {
        class E1 extends Error { }
        class E2 extends Error { }
        class E3 extends Error { }
        class E4 extends Error { }
        class E5 extends Error { }
        class E6 extends Error { }
        class E7 extends Error { }
        class E8 extends Error { }
        class E9 extends Error { }
        class E10 extends Error { }
        class E11 extends Error { }
        class E12 extends Error { }

        type AllErrors = E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12;

        const result: Result<number, AllErrors> = Result.err(new E7('lucky seven'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .when(E1, () => 'error 1')
            .when(E2, () => 'error 2')
            .when(E3, () => 'error 3')
            .when(E4, () => 'error 4')
            .when(E5, () => 'error 5')
            .when(E6, () => 'error 6')
            .when(E7, (e) => `error 7: ${e.message}`)
            .when(E8, () => 'error 8')
            .when(E9, () => 'error 9')
            .when(E10, () => 'error 10')
            .when(E11, () => 'error 11')
            .when(E12, () => 'error 12')
            .run();

        expect(message).toBe('error 7: lucky seven');
    });

    it('works with many error types and otherwise', () => {
        class E1 extends Error { }
        class E2 extends Error { }
        class E3 extends Error { }
        class E4 extends Error { }
        class E5 extends Error { }
        class E6 extends Error { }
        class E7 extends Error { }
        class E8 extends Error { }
        class E9 extends Error { }
        class E10 extends Error { }
        class E11 extends Error { }
        class E12 extends Error { }
        class E13 extends Error { }

        type AllErrors = E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12 | E13;

        const result: Result<number, AllErrors> = Result.err(new E13('unlucky'));

        if (!result.isErr()) throw new Error('expected Err');

        const message = result
            .matchErr()
            .when(E1, () => 'error 1')
            .when(E2, () => 'error 2')
            .when(E3, () => 'error 3')
            .when(E4, () => 'error 4')
            .when(E5, () => 'error 5')
            .when(E6, () => 'error 6')
            .when(E7, () => 'error 7')
            .when(E8, () => 'error 8')
            .when(E9, () => 'error 9')
            .when(E10, () => 'error 10')
            .otherwise((e: E11 | E12 | E13) => `unhandled: ${e.message}`);

        expect(message).toBe('unhandled: unlucky');
    });
});

describe('Result.match()', () => {
    it('works with many error types (10+)', () => {
        class E1 extends Error { }
        class E2 extends Error { }
        class E3 extends Error { }
        class E4 extends Error { }
        class E5 extends Error { }
        class E6 extends Error { }
        class E7 extends Error { }
        class E8 extends Error { }
        class E9 extends Error { }
        class E10 extends Error { }
        class E11 extends Error { }
        class E12 extends Error { }

        type AllErrors = E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12;

        const result: Result<number, AllErrors> = Result.err(new E5('five'));

        const message = result
            .match()
            .err(E1, () => 'error 1')
            .err(E2, () => 'error 2')
            .err(E3, () => 'error 3')
            .err(E4, () => 'error 4')
            .err(E5, (e) => `error 5: ${e.message}`)
            .err(E6, () => 'error 6')
            .err(E7, () => 'error 7')
            .err(E8, () => 'error 8')
            .err(E9, () => 'error 9')
            .err(E10, () => 'error 10')
            .err(E11, () => 'error 11')
            .err(E12, () => 'error 12')
            .ok((value) => `ok: ${value}`)
            .run();

        expect(message).toBe('error 5: five');
    });

    it('works with many error types mixed with errVal', () => {
        class E1 extends Error { }
        class E2 extends Error { }
        class E3 extends Error { }
        class E4 extends Error { }
        class E5 extends Error { }

        type AllErrors = E1 | E2 | E3 | E4 | E5 | 'CODE1' | 'CODE2' | 'CODE3' | 'CODE4' | 'CODE5';

        const result: Result<string, AllErrors> = Result.err('CODE3');

        const message = result
            .match()
            .err(E1, () => 'error 1')
            .errVal('CODE1', () => 'code 1')
            .err(E2, () => 'error 2')
            .errVal('CODE2', () => 'code 2')
            .err(E3, () => 'error 3')
            .errVal('CODE3', () => 'code 3 matched!')
            .err(E4, () => 'error 4')
            .errVal('CODE4', () => 'code 4')
            .err(E5, () => 'error 5')
            .errVal('CODE5', () => 'code 5')
            .ok((value) => `ok: ${value}`)
            .run();

        expect(message).toBe('code 3 matched!');
    });

    it('throws error when Result is neither Ok nor Err (unreachable case)', () => {
        // Create a malformed Result object that bypasses type checking
        const malformedResult = {
            isOk: () => false,
            isErr: () => false,
            value: undefined,
            error: undefined,
        } as unknown as Result<number, string>;

        const builder = ResultMatchBuilderClass.fromResult(malformedResult)
            .err(Error, () => 'error')
            .ok(() => 'ok');

        expect(() => builder.run()).toThrow('Unreachable: Result is neither Ok nor Err');
    });

    it('throws error when ok() handler is missing in run()', () => {
        const result = ok<number, string>(42);

        // Create a builder without ok() handler by accessing private constructor
        // This tests the defensive check in run()
        const builder = new ResultMatchBuilderClass(result, [], undefined);

        expect(() => {
            // @ts-expect-error - accessing private method for testing
            builder.run();
        }).toThrow('ResultMatchBuilder.run() requires an ok() handler.');
    });

    it('throws error when no err cases match and no otherwise handler', () => {
        const result = Result.err<'A' | 'B', number>('A');

        const builder = result
            .match()
            .errVal('B', () => 'matched B')
            .ok(() => 'ok');

        expect(() => builder.run()).toThrow('A');
    });

    it('handles multiple whenGuard calls in matchErr', () => {
        class ErrorWithCode extends Error {
            constructor(message: string, public readonly code: number) {
                super(message);
            }
        }

        class ErrorWithStatus extends Error {
            constructor(message: string, public readonly status: string) {
                super(message);
            }
        }

        type AppError = ErrorWithCode | ErrorWithStatus | string;

        const hasCode = (e: AppError): e is ErrorWithCode => e instanceof ErrorWithCode && typeof e.code === 'number';
        const hasStatus = (e: AppError): e is ErrorWithStatus => e instanceof ErrorWithStatus && typeof e.status === 'string';

        const result: Result<number, AppError> = Result.err(new ErrorWithStatus('failed', 'critical'));

        const out = result
            .matchErr()
            .whenGuard(hasCode, (e) => ok(`Code ${e.code}: ${e.message}`))
            .whenGuard(hasStatus, (e) => ok(`Status ${e.status}: ${e.message}`))
            .otherwise((e) => new UnknownError(`Unknown: ${String(e)}`));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe('Status critical: failed');
        }
    });
});

// Type-only Checks
const _typeChecks = () => {
    const result: Result<number, IOError | ParseError> = Result.err(new IOError('io'));

    // @ts-expect-error run() requires ok()
    result.match().err(IOError, () => 'io').run();

    result
        .match()
        .err(IOError, () => 'io')
        .ok(() => 'ok')
        .run();
};
void _typeChecks;
