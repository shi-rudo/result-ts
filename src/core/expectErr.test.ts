import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from './result';
import { expectErr } from './expectErr';
import { ERR_EXPECT_ERR, ExpectErrError, InvalidResultStateError } from '../errors';

describe('expectErr', () => {
    it('returns Error for Err', () => {
        expect(expectErr(err('boom'), 'should not throw')).toBe('boom');
    });

    it('throws Error for Ok with custom message', () => {
        let caughtError: unknown;
        try {
            expectErr(ok(42), 'expected err');
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(ExpectErrError);
        expect((caughtError as ExpectErrError).code).toBe(ERR_EXPECT_ERR);
        expect((caughtError as ExpectErrError).message).toContain('expected err');
    });

    it('throws InvalidResultStateError for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => expectErr(malformed, 'expected err')).toThrow(InvalidResultStateError);
    });
});
