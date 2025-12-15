import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';

class IOError extends Error {}
class ParseError extends Error {}
class ValidationError extends Error {}
class UnknownError extends Error {}

describe('Result.match()', () => {
    it('ist exhaustiv mit run() (E wird zu never)', () => {
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

    it('unterstützt otherwise() für nicht-exhaustive Matches', () => {
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
});

describe('Result.matchErr()', () => {
    it('liefert Result zurück und wrappt Error-Values automatisch', () => {
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

    it('ruft otherwise nicht auf, wenn Source Ok ist', () => {
        const result: Result<number, IOError | ParseError> = ok<number, IOError | ParseError>(1);
        const otherwise = vi.fn(() => new UnknownError('nope'));

        const out = result.matchErr().when(IOError, () => ok(2)).otherwise(otherwise);

        expect(otherwise).toHaveBeenCalledTimes(0);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(1);
        }
    });
});

