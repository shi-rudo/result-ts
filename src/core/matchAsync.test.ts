import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { matchAsync } from './matchAsync';

describe('matchAsync', () => {
    it('wendet ok-Handler bei Ok an', async () => {
        const result = ok(42);
        const output = await result.pipeAsync(matchAsync({
            ok: async (value) => `success: ${value}`,
            err: async (error) => `error: ${error}`
        }));
        expect(output).toBe('success: 42');
    });

    it('wendet err-Handler bei Err an', async () => {
        const result = err('something went wrong');
        const output = await result.pipeAsync(matchAsync({
            ok: async (value) => `success: ${value}`,
            err: async (error) => `error: ${error}`
        }));
        expect(output).toBe('error: something went wrong');
    });

    it('funktioniert mit wirklich async Handlers', async () => {
        const result = ok(2);
        const output = await result.pipeAsync(matchAsync({
            ok: async (value) => {
                await Promise.resolve(); // simulate async
                return `async success: ${value * 3}`;
            },
            err: async (error) => `async error: ${error}`
        }));
        expect(output).toBe('async success: 6');
    });
});