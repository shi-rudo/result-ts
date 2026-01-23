import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { unwrapErr } from './unwrapErr';
import { ERR_UNWRAP_ERR_ON_OK, UnwrapErrOnOkError } from '../errors';

describe('unwrapErr', () => {
    it('gibt Error bei Err zurück', () => {
        expect(unwrapErr(err('boom'))).toBe('boom');
    });

    it('wirft Error bei Ok', () => {
        let caughtError: unknown;
        try {
            unwrapErr(ok(42));
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(UnwrapErrOnOkError);
        expect((caughtError as UnwrapErrOnOkError).code).toBe(ERR_UNWRAP_ERR_ON_OK);
        expect((caughtError as UnwrapErrOnOkError).message).toContain('Called unwrapErr() on Ok: 42');
    });
});
