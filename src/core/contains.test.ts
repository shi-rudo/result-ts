import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { contains } from './contains';

describe('contains', () => {
    it('gibt true bei Ok mit passendem Wert', () => {
        expect(contains(ok(42), 42)).toBe(true);
    });

    it('gibt false bei Ok mit anderem Wert', () => {
        expect(contains(ok(42), 43)).toBe(false);
    });

    it('gibt false bei Err', () => {
        expect(contains(Result.err('error'), 42)).toBe(false);
    });
});