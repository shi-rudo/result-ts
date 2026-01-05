import { describe, expect, it } from 'vitest';

import { Result, ok, err } from '../index';
import { isErr } from './isErr';

describe('isErr', () => {
    it('returns false for Ok', () => {
        expect(isErr(ok(42))).toBe(false);
    });

    it('returns true for Err', () => {
        expect(isErr(err('error'))).toBe(true);
    });

    it('works as a type guard', () => {
        const result = err('error message');
        if (isErr(result)) {
            expect(result.error).toBe('error message');
        }
    });
});
