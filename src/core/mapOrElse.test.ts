import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from './result';
import { mapOrElse } from './mapOrElse';

describe('mapOrElse', () => {
    it('applies function to Ok', () => {
        expect(mapOrElse(ok(2), () => 0, x => x * 3)).toBe(6);
    });

    it('calls default function for Err', () => {
        const defaultFn = vi.fn(() => 99);
        expect(mapOrElse(Result.err('error'), defaultFn, x => x * 3)).toBe(99);
        expect(defaultFn).toHaveBeenCalledWith('error');
    });
});