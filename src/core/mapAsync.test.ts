import { describe, expect, it, vi } from 'vitest';

import { mapAsync } from './mapAsync';
import { err, ok } from './result';

describe('mapAsync', () => {
    it('maps Ok value asynchronously', async () => {
        const project = vi.fn(async (value: number) => value * 2);

        const result = await ok(2).pipeAsync(mapAsync(project));

        expect(project).toHaveBeenCalledWith(2);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(4);
        }
    });

    it('keeps Err and does not call project', async () => {
        const project = vi.fn(async () => 123);
        const source = err('boom');

        const result = await source.pipeAsync(mapAsync(project));

        expect(project).not.toHaveBeenCalled();
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('boom');
        }
    });
});
