import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { isOk } from './isOk';

describe('isOk', () => {
    it('returns true for Ok', () => {
        expect(isOk(ok(42))).toBe(true);
    });

    it('returns false for Err', () => {
        expect(isOk(err('error'))).toBe(false);
    });

    it('works as a Type Guard', () => {
        const result = ok(42);
        if (isOk(result)) {
            expect(result.value).toBe(42);
        }
    });
});
