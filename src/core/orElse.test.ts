import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';
import { orElse } from './orElse';

describe('orElse', () => {
    it('gibt ersten Ok bei Ok zurück', () => {
        expect(orElse(ok(1), () => ok(2))).toEqual(ok(1));
    });

    it('ruft Funktion bei Err auf', () => {
        const fn = vi.fn(() => ok(99));
        expect(orElse(Result.err('error'), fn)).toEqual(ok(99));
        expect(fn).toHaveBeenCalledWith('error');
    });
});