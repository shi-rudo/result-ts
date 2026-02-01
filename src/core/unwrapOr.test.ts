import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { unwrapOr } from './unwrapOr';

describe('unwrapOr', () => {
    it('returns value on Ok', () => {
        expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('returns default on Err', () => {
        expect(unwrapOr(err('boom'), 99)).toBe(99);
    });
});

