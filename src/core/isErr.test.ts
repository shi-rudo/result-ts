import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { isErr } from './isErr';

describe('isErr', () => {
    it('returns false for Ok', () => {
        expect(isErr(ok(42))).toBe(false);
    });

    it('returns true for Err', () => {
        expect(isErr(err('error'))).toBe(true);
    });

    it('works as a Type Guard', () => {
        const result = err('error message');
        if (isErr(result)) {
            expect(result.error).toBe('error message');
        }
    });
});
