import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { expectResult } from './expectResult';
import { ERR_EXPECT_OK, ExpectOkError } from '../errors';

describe('expectResult', () => {
    it('returns value for Ok', () => {
        expect(expectResult(ok(42), 'custom message')).toBe(42);
    });

    it('throws custom Error for Err', () => {
        let caughtError: unknown;
        try {
            expectResult(Result.err('error'), 'custom message');
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(ExpectOkError);
        expect((caughtError as ExpectOkError).code).toBe(ERR_EXPECT_OK);
        expect((caughtError as ExpectOkError).message).toContain('custom message');
    });
});
