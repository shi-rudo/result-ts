import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from '../index';
import { tryCatchAsync } from './tryCatchAsync';

describe('tryCatchAsync', () => {
    it('runs the async function and returns Ok on success', async () => {
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

    it('catches exceptions from async functions', async () => {
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

    it('catches sync exceptions from async functions', async () => {
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

    it('applies errorMapper for async functions', async () => {
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

    it('skips tryCatchAsync when the source is already Err', async () => {
        const fn = vi.fn(async () => 42);
        const source = err('original error');

        const result = await source.pipeAsync(tryCatchAsync(fn));

        expect(result).toBe(source);
        expect(fn).not.toHaveBeenCalled();
    });

    it('works with rejected Promises', async () => {
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

    it('can be used in async pipe chains', async () => {
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
