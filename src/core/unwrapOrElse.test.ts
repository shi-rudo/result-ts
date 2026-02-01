import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';
import { unwrapOrElse } from './unwrapOrElse';

describe('unwrapOrElse', () => {
    it('returns value on Ok', () => {
        expect(unwrapOrElse(ok(42), () => 0)).toBe(42);
    });

    it('calls function on Err', () => {
        const fn = vi.fn(() => 99);
        expect(unwrapOrElse(Result.err('error'), fn)).toBe(99);
        expect(fn).toHaveBeenCalledWith('error');
    });
});