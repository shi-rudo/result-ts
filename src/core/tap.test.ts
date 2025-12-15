import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { tap } from './tap';

describe('tap', () => {
    it('führt ok callback bei Ok aus', () => {
        const callback = vi.fn();
        const result = ok(42);
        const tapped = result.pipe(tap({ ok: callback }));

        expect(tapped).toBe(result); // Gleiche Instanz
        expect(callback).toHaveBeenCalledWith(42);
    });

    it('führt err callback bei Err aus', () => {
        const callback = vi.fn();
        const result = err('error');
        const tapped = result.pipe(tap({ err: callback }));

        expect(tapped).toBe(result); // Gleiche Instanz
        expect(callback).toHaveBeenCalledWith('error');
    });

    it('führt beide callbacks aus wenn beide definiert sind', () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        // Test mit Ok
        const okResult = ok(42);
        okResult.pipe(tap({ ok: okCallback, err: errCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);
        expect(errCallback).not.toHaveBeenCalled();

        // Test mit Err
        const errResult = err('error');
        errResult.pipe(tap({ ok: okCallback, err: errCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Immer noch nur 1 Aufruf
        expect(errCallback).toHaveBeenCalledWith('error');
    });

    it('überspringt callbacks wenn nicht definiert', () => {
        const okCallback = vi.fn();
        const errCallback = vi.fn();

        const okResult = ok(42);
        const errResult = err('error');

        // Nur ok callback definiert
        okResult.pipe(tap({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledWith(42);

        errResult.pipe(tap({ ok: okCallback }));
        expect(okCallback).toHaveBeenCalledTimes(1); // Immer noch nur 1 Aufruf

        // Nur err callback definiert
        errResult.pipe(tap({ err: errCallback }));
        expect(errCallback).toHaveBeenCalledWith('error');
    });

    it('funktioniert in Pipe-Ketten', () => {
        const seen: string[] = [];
        const result = ok(2).pipe(
            tap({ ok: (v) => seen.push(`start:${v}`) }),
            (r) => r,
            tap({ ok: (v) => seen.push(`end:${v}`) })
        );

        expect(seen).toEqual(['start:2', 'end:2']);
    });
});