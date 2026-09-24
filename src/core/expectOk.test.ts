import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { expectOk } from './expectOk';
import { ERR_EXPECT_OK, ExpectOkError, InvalidResultStateError } from '../errors';

describe('expectOk', () => {
    it('returns value for Ok', () => {
        expect(expectOk(ok(42), 'custom message')).toBe(42);
    });

    it('throws custom Error for Err', () => {
        let caughtError: unknown;
        try {
            expectOk(Result.err('error'), 'custom message');
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(ExpectOkError);
        expect((caughtError as ExpectOkError).code).toBe(ERR_EXPECT_OK);
        expect((caughtError as ExpectOkError).message).toContain('custom message');
    });

    it('preserves the original Err value on the thrown error', () => {
        const original = new Error('db down');
        let caughtError: unknown;
        try {
            expectOk(Result.err(original), 'custom message');
        } catch (error) {
            caughtError = error;
        }
        expect((caughtError as ExpectOkError).errorValue).toBe(original);
        expect((caughtError as ExpectOkError).cause).toBe(original);
        expect((caughtError as ExpectOkError).message).toContain('db down');
    });

    it('throws InvalidResultStateError for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => expectOk(malformed, 'custom message')).toThrow(InvalidResultStateError);
    });
});
