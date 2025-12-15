import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { tapAsync } from './tapAsync';

describe('tapAsync', () => {
    it('führt ok callback bei Ok aus', async () => {
        const callback = vi.fn();
        const result = ok(42);
        const tapped = await result.pipeAsync(tapAsync({ ok: callback }));

        expect(tapped).toBe(result); // Gleiche Instanz
        expect(callback).toHaveBeenCalledWith(42);
    });

    it('führt err callback bei Err aus', async () => {
        const callback = vi.fn();
        const result = err('error');
        const tapped = await result.pipeAsync(tapAsync({ err: callback }));

        expect(tapped).toBe(result); // Gleiche Instanz
        expect(callback).toHaveBeenCalledWith('error');
    });

    it('führt async callbacks aus', async () => {
        const callback = vi.fn(async (value) => {
            await Promise.resolve();
            return value * 2;
        });

        const result = ok(21);
        await result.pipeAsync(tapAsync({ ok: async (v) => { await callback(v); return Promise.resolve(); } }));

        expect(callback).toHaveBeenCalledWith(21);
    });

    it('wartet auf async callbacks', async () => {
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

    it('funktioniert in async Pipe-Ketten', async () => {
        const seen: string[] = [];
        const result = await ok(2).pipeAsync(
            tapAsync({ ok: async (v) => { seen.push(`start:${v}`); return Promise.resolve(); } }),
            (r) => Promise.resolve(r),
            tapAsync({ ok: async (v) => { seen.push(`end:${v}`); return Promise.resolve(); } })
        );

        expect(seen).toEqual(['start:2', 'end:2']);
    });

    it('überspringt callbacks wenn nicht definiert', async () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        const okResult = ok(42);
        const errResult = err('error');

        // Nur ok callback definiert
        await okResult.pipeAsync(tapAsync({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);

        await errResult.pipeAsync(tapAsync({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Immer noch nur 1 Aufruf

        // Nur err callback definiert
        await errResult.pipeAsync(tapAsync({ err: errCallback }));
        expect(errCallback).toHaveBeenCalledWith('error');
    });
});