import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { expectErr } from './expectErr';
import { ERR_EXPECT_ERR, ExpectErrError } from '../errors';

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
});
