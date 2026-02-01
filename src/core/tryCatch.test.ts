import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { tryCatch } from './tryCatch';

describe('tryCatch', () => {
    it('executes function and returns Ok on success', () => {
        const fn = vi.fn(() => 42);
        const result = ok('any').pipe(tryCatch(fn));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
        expect(fn).toHaveBeenCalled();
    });

    it('catches exceptions and returns Err', () => {
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

    it('applies errorMapper to transform exceptions', () => {
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

    it('skips tryCatch if source is already Err', () => {
        const fn = vi.fn(() => 42);
        const source = err('original error');

        const result = source.pipe(tryCatch(fn));

        expect(result).toBe(source);
        expect(fn).not.toHaveBeenCalled();
    });

    it('works with different exception types', () => {
        const fn = vi.fn(() => {
            throw 'string error';
        });
        const result = ok('any').pipe(tryCatch(fn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('string error');
        }
    });

    it('can be used in pipe chains', () => {
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
