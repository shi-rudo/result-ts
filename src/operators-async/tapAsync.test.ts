import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from '../index';
import { tapAsync } from './tapAsync';

describe('tapAsync', () => {
    it('calls the ok callback on Ok', async () => {
        const callback = vi.fn();
        const result = ok(42);
        const tapped = await result.pipeAsync(tapAsync({ ok: callback }));

        expect(tapped).toBe(result); // Same instance
        expect(callback).toHaveBeenCalledWith(42);
    });

    it('calls the err callback on Err', async () => {
        const callback = vi.fn();
        const result = err('error');
        const tapped = await result.pipeAsync(tapAsync({ err: callback }));

        expect(tapped).toBe(result); // Same instance
        expect(callback).toHaveBeenCalledWith('error');
    });

    it('runs async callbacks', async () => {
        const callback = vi.fn(async (value) => {
            await Promise.resolve();
            return value * 2;
        });

        const result = ok(21);
        await result.pipeAsync(tapAsync({ ok: async (v) => { await callback(v); return Promise.resolve(); } }));

        expect(callback).toHaveBeenCalledWith(21);
    });

    it('waits for async callbacks', async () => {
        let called = false;
        const callback = vi.fn(async () => {
            await Promise.resolve();
            called = true;
        });

        const result = ok(42);
        await result.pipeAsync(tapAsync({ ok: callback }));

        expect(called).toBe(true);
        expect(callback).toHaveBeenCalledWith(42);
    });

    it('works in async pipe chains', async () => {
        const seen: string[] = [];
        const result = await ok(2).pipeAsync(
            tapAsync({ ok: async (v) => { seen.push(`start:${v}`); return Promise.resolve(); } }),
            (r) => Promise.resolve(r),
            tapAsync({ ok: async (v) => { seen.push(`end:${v}`); return Promise.resolve(); } })
        );

        expect(seen).toEqual(['start:2', 'end:2']);
    });

    it('skips callbacks when not defined', async () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        const okResult = ok(42);
        const errResult = err('error');

        // Only ok callback defined
        await okResult.pipeAsync(tapAsync({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);

        await errResult.pipeAsync(tapAsync({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Still only 1 call

        // Only err callback defined
        await errResult.pipeAsync(tapAsync({ err: errCallback }));
        expect(errCallback).toHaveBeenCalledWith('error');
    });
});
