import { describe, expect, it } from 'vitest';

import { foldAsync } from './foldAsync';
import { err, ok } from './result';

describe('foldAsync', () => {
    it('folds Ok value asynchronously', async () => {
        const out = await ok(3).pipeAsync(
            foldAsync({
                ok: async (value) => value * 3,
                err: async () => -1,
            })
        );

        expect(out).toBe(9);
    });

    it('folds Err value asynchronously', async () => {
        const out = await err('boom').pipeAsync(
            foldAsync({
                ok: async () => 'ok',
                err: async (error) => error,
            })
        );

        expect(out).toBe('boom');
    });
});
