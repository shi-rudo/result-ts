import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from '../index';
import { orElse } from './orElse';

describe('orElse', () => {
    it('returns the first Ok on Ok', () => {
        expect(orElse(ok(1), () => ok(2))).toEqual(ok(1));
    });

    it('calls the function on Err', () => {
        const fn = vi.fn(() => ok(99));
        expect(orElse(Result.err('error'), fn)).toEqual(ok(99));
        expect(fn).toHaveBeenCalledWith('error');
    });
});
