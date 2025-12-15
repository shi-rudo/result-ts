import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { tryCatch } from './tryCatch';

describe('tryCatch', () => {
    it('führt Funktion aus und gibt Ok zurück bei Erfolg', () => {
        const fn = vi.fn(() => 42);
        const result = ok('any').pipe(tryCatch(fn));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
        expect(fn).toHaveBeenCalled();
    });

    it('fängt Exceptions ab und gibt Err zurück', () => {
        const fn = vi.fn(() => {
            throw new Error('test error');
        });
        const result = ok('any').pipe(tryCatch(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('test error');
        }
    });

    it('wendet errorMapper an um Exceptions zu transformieren', () => {
        const fn = vi.fn(() => {
            throw new Error('raw error');
        });
        const errorMapper = vi.fn((error) => `mapped: ${(error as Error).message}`);
        const result = ok('any').pipe(tryCatch(fn, errorMapper));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('mapped: raw error');
        }
        expect(errorMapper).toHaveBeenCalledWith(expect.any(Error));
    });

    it('überspringt tryCatch wenn Source bereits Err ist', () => {
        const fn = vi.fn(() => 42);
        const source = err('original error');

        const result = source.pipe(tryCatch(fn));

        expect(result).toBe(source);
        expect(fn).not.toHaveBeenCalled();
    });

    it('funktioniert mit verschiedenen Exception-Typen', () => {
        const fn = vi.fn(() => {
            throw 'string error';
        });
        const result = ok('any').pipe(tryCatch(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('string error');
        }
    });

    it('kann in Pipe-Ketten verwendet werden', () => {
        const result = ok('input').pipe(
            tryCatch(() => 'processed'),
            (r) => r.isOk() ? ok('final') : r
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('final');
        }
    });
});
