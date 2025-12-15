import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';
import { mapOrElse } from './mapOrElse';

describe('mapOrElse', () => {
    it('wendet Funktion bei Ok an', () => {
        expect(mapOrElse(ok(2), () => 0, x => x * 3)).toBe(6);
    });

    it('ruft Default-Funktion bei Err auf', () => {
        const defaultFn = vi.fn(() => 99);
        expect(mapOrElse(Result.err('error'), defaultFn, x => x * 3)).toBe(99);
        expect(defaultFn).toHaveBeenCalledWith('error');
    });
});