import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';
import { orElse } from './orElse';

describe('orElse', () => {
    it('works as a pipe operator', () => {
        expect(ok(1).pipe(orElse(() => ok(2)))).toEqual(ok(1));
        expect(Result.err('boom').pipe(orElse(error => ok(error.length)))).toEqual(ok(4));
    });

    it('returns first Ok if Ok', () => {
        expect(orElse(ok(1), () => ok(2))).toEqual(ok(1));
    });

    it('calls function if Err', () => {
        const fn = vi.fn(() => ok(99));
        expect(orElse(Result.err('error'), fn)).toEqual(ok(99));
        expect(fn).toHaveBeenCalledWith('error');
    });
});