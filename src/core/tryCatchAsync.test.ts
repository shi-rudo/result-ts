import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { tryCatchAsync } from './tryCatchAsync';

describe('tryCatchAsync', () => {
    it('führt async Funktion aus und gibt Ok zurück bei Erfolg', async () => {
        const fn = vi.fn(async () => {
            await Promise.resolve();
            return 42;
        });
        const result = await ok('any').pipeAsync(tryCatchAsync(fn));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
        expect(fn).toHaveBeenCalled();
    });

    it('fängt Exceptions aus async Funktionen ab', async () => {
        const fn = vi.fn(async () => {
            await Promise.resolve();
            throw new Error('async error');
        });
        const result = await ok('any').pipeAsync(tryCatchAsync(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('async error');
        }
    });

    it('fängt sync Exceptions aus async Funktionen ab', async () => {
        const fn = vi.fn(async () => {
            throw new Error('sync error in async');
        });
        const result = await ok('any').pipeAsync(tryCatchAsync(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('sync error in async');
        }
    });

    it('wendet errorMapper bei async Funktionen an', async () => {
        const fn = vi.fn(async () => {
            throw new Error('async error');
        });
        const errorMapper = vi.fn((error) => `mapped: ${(error as Error).message}`);
        const result = await ok('any').pipeAsync(tryCatchAsync(fn, errorMapper));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('mapped: async error');
        }
        expect(errorMapper).toHaveBeenCalledWith(expect.any(Error));
    });

    it('überspringt tryCatchAsync wenn Source bereits Err ist', async () => {
        const fn = vi.fn(async () => 42);
        const source = err('original error');

        const result = await source.pipeAsync(tryCatchAsync(fn));

        expect(result).toBe(source);
        expect(fn).not.toHaveBeenCalled();
    });

    it('funktioniert mit rejected Promises', async () => {
        const fn = vi.fn(async () => {
            await Promise.reject('promise rejection');
            return 42;
        });
        const result = await ok('any').pipeAsync(tryCatchAsync(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('promise rejection');
        }
    });

    it('kann in async Pipe-Ketten verwendet werden', async () => {
        const result = await ok('input').pipeAsync(
            tryCatchAsync(async () => {
                await Promise.resolve();
                return 'processed';
            }),
            async (r) => r.isOk() ? ok('final') : r
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('final');
        }
    });
});
