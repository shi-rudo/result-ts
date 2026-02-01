import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { collectFirstOkAsync } from './collectFirstOkAsync';

describe('collectFirstOkAsync', () => {
    it('returns first Ok Result', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.resolve(err('error2')),
            Promise.resolve(ok(42)),
            Promise.resolve(err('error3'))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('collects all Errors if no Ok found', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.resolve(err('error2')),
            Promise.resolve(err('error3'))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'error2', 'error3']);
        }
    });

    it('treats Promise rejections as Errors', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.reject('promise error'),
            Promise.resolve(ok(42))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('returns empty Error array for empty Promise array', async () => {
        const promises: Promise<Result<number, string>>[] = [];
        const result = await collectFirstOkAsync(promises);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual([]);
        }
    });

    it('supports Thunks and is truly sequential', async () => {
        const t1 = vi.fn(async () => err('error1'));
        const t2 = vi.fn(async () => ok(42));
        const t3 = vi.fn(async () => ok(99));

        const result = await collectFirstOkAsync([t1, t2, t3] as const);

        expect(t1).toHaveBeenCalledTimes(1);
        expect(t2).toHaveBeenCalledTimes(1);
        expect(t3).toHaveBeenCalledTimes(0);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }
    });
});
