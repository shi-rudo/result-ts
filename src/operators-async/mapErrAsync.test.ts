import { describe, expect, it, vi } from 'vitest';

import { err, ok } from '../index';
import { mapErrAsync } from './mapErrAsync';

describe('mapErrAsync', () => {
    it('returns source on Ok', async () => {
        const project = vi.fn(async (e: string) => `mapped:${e}`);
        const source = ok<number, string>(1);

        const out = await source.pipeAsync(mapErrAsync(project));

        expect(out).toBe(source);
        expect(project).not.toHaveBeenCalled();
    });

    it('maps Err via async project', async () => {
        const project = vi.fn(async (e: string) => e.toUpperCase());
        const source = err<string, number>('boom');

        const out = await source.pipeAsync(mapErrAsync(project));

        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toBe('BOOM');
        }
        expect(project).toHaveBeenCalledWith('boom');
    });
});
