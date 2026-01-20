import { describe, expect, it } from 'vitest';

import { isResult } from './isResult';
import { err, ok } from './result';

describe('isResult', () => {
    it('returns true for Ok and Err', () => {
        expect(isResult(ok(1))).toBe(true);
        expect(isResult(err('boom'))).toBe(true);
    });

    it('returns false for non-Result values', () => {
        expect(isResult(null)).toBe(false);
        expect(isResult(undefined)).toBe(false);
        expect(isResult({})).toBe(false);
        expect(isResult({ isOk: () => true })).toBe(false);
        expect(isResult({ isOk: () => true, isErr: 'nope' })).toBe(false);
    });
});
