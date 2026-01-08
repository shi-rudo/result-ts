import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { mapOr } from './mapOr';

describe('mapOr', () => {
    it('applies the function on Ok', () => {
        expect(mapOr(ok(2), 0, x => x * 3)).toBe(6);
    });

    it('returns the default on Err', () => {
        expect(mapOr(Result.err('error'), 99, x => x * 3)).toBe(99);
    });
});
