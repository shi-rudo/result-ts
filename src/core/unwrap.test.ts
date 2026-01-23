import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { unwrap } from './unwrap';
import { ERR_UNWRAP_ON_ERR, UnwrapOnErrError } from '../errors';

describe('unwrap', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(unwrap(ok(42))).toBe(42);
    });

    it('wirft Error bei Err', () => {
        let caughtError: unknown;
        try {
            unwrap(Result.err('error'));
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(UnwrapOnErrError);
        expect((caughtError as UnwrapOnErrError).code).toBe(ERR_UNWRAP_ON_ERR);
        expect((caughtError as UnwrapOnErrError).message).toContain('Called unwrap() on Err: error');
    });
});
