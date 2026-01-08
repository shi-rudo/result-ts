import { describe, expect, it, vi } from 'vitest';

import { Result, ok } from '../index';
import { mapOrElse } from './mapOrElse';

describe('mapOrElse', () => {
    it('applies the function on Ok', () => {
        expect(mapOrElse(ok(2), () => 0, x => x * 3)).toBe(6);
    });

    it('calls the default function on Err', () => {
        const defaultFn = vi.fn(() => 99);
        expect(mapOrElse(Result.err('error'), defaultFn, x => x * 3)).toBe(99);
        expect(defaultFn).toHaveBeenCalledWith('error');
    });
});
