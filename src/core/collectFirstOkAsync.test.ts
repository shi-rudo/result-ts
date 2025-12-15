import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { collectFirstOkAsync } from './collectFirstOkAsync';

describe('collectFirstOkAsync', () => {
    it('gibt erstes Ok Result zurück', async () => {
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

    it('sammelt alle Errors wenn kein Ok gefunden', async () => {
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

    it('behandelt Promise rejections als Errors', async () => {
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

    it('gibt leeres Error Array für leeres Promise Array', async () => {
        const promises: Promise<Result<number, string>>[] = [];
        const result = await collectFirstOkAsync(promises);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual([]);
        }
    });

    it('unterstützt Thunks und ist wirklich sequentiell', async () => {
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
