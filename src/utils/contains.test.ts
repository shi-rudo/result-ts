import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { contains } from './contains';

describe('contains', () => {
    it('returns true for Ok with matching value', () => {
        expect(contains(ok(42), 42)).toBe(true);
    });

    it('returns false for Ok with a different value', () => {
        expect(contains(ok(42), 43)).toBe(false);
    });

    it('returns false for Err', () => {
        expect(contains(Result.err('error'), 42)).toBe(false);
    });
});
