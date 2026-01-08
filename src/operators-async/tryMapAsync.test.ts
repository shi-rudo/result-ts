import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '../index';
import { tryMapAsync } from './tryMapAsync';

describe('tryMapAsync', () => {
    it('maps Ok value and returns Ok', async () => {
        const project = vi.fn(async (n: number) => n + 1);

        const out = await ok<number, string>(1).pipeAsync(tryMapAsync(project));

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(2);
        }
        expect(project).toHaveBeenCalledWith(1);
    });

    it('uses errorMapper to transform exceptions', async () => {
        const project = vi.fn(async (_n: number) => {
            throw new Error('boom');
        });
        const errorMapper = vi.fn((e: unknown) => `mapped:${(e as Error).message}`);

        const out = await ok<number, string>(1).pipeAsync(tryMapAsync(project, errorMapper));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBe('mapped:boom');
        }

        expect(project).toHaveBeenCalledWith(1);
        expect(errorMapper).toHaveBeenCalled();
    });

    it('turns exceptions into Err without errorMapper', async () => {
        const project = vi.fn(async (_n: number) => {
            throw new Error('boom');
        });

        const out = await ok<number, string>(1).pipeAsync(tryMapAsync(project));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBeInstanceOf(Error);
            expect((out.error as Error).message).toBe('boom');
        }

        expect(project).toHaveBeenCalledWith(1);
    });

    it('skips the project when the source is already Err', async () => {
        const project = vi.fn(async (_n: never) => 123);
        const source = err('original error');

        const out = await source.pipeAsync(tryMapAsync(project));

        expect(out).toBe(source);
        expect(project).not.toHaveBeenCalled();
    });
});
