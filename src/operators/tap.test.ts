import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from '../index';
import { tap } from './tap';

describe('tap', () => {
    it('calls the ok callback on Ok', () => {
        const callback = vi.fn();
        const result = ok(42);
        const tapped = result.pipe(tap({ ok: callback }));

        expect(tapped).toBe(result); // Same instance
        expect(callback).toHaveBeenCalledWith(42);
    });

    it('calls the err callback on Err', () => {
        const callback = vi.fn();
        const result = err('error');
        const tapped = result.pipe(tap({ err: callback }));

        expect(tapped).toBe(result); // Same instance
        expect(callback).toHaveBeenCalledWith('error');
    });

    it('calls both callbacks when both are defined', () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        // Test with Ok
        const okResult = ok(42);
        okResult.pipe(tap({ ok: okCallback, err: errCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);
        expect(errCallback).not.toHaveBeenCalled();

        // Test with Err
        const errResult = err('error');
        errResult.pipe(tap({ ok: okCallback, err: errCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Still only 1 call
        expect(errCallback).toHaveBeenCalledWith('error');
    });

    it('skips callbacks when not defined', () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        const okResult = ok(42);
        const errResult = err('error');

        // Only ok callback defined
        okResult.pipe(tap({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);

        errResult.pipe(tap({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Still only 1 call

        // Only err callback defined
        errResult.pipe(tap({ err: errCallback }));
        expect(errCallback).toHaveBeenCalledWith('error');
    });

    it('works in pipe chains', () => {
        const seen: string[] = [];
        const result = ok(2).pipe(
            tap({ ok: (v) => seen.push(`start:${v}`) }),
            (r) => r,
            tap({ ok: (v) => seen.push(`end:${v}`) })
        );

        expect(seen).toEqual(['start:2', 'end:2']);
    });
});
