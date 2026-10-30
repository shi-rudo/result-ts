import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { unwrap } from './unwrap';
import { ERR_UNWRAP_ON_ERR, UnwrapOnErrError } from '../errors';

describe('unwrap', () => {
    it('returns value on Ok', () => {
        expect(unwrap(ok(42))).toBe(42);
    });

    it('throws Error on Err', () => {
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

    it('keeps the Err value as the cause of the thrown error', () => {
        const original = new Error('db down');

        expect(() => unwrap(Result.err(original))).toThrow(expect.objectContaining({ cause: original }));
        expect(() => Result.err(original).unwrap()).toThrow(expect.objectContaining({ cause: original }));
    });
});
