import { describe, expect, it } from 'vitest';

import { Result, ok, err } from '../index';
import { foldAsync } from './foldAsync';

describe('foldAsync', () => {
    it('applies the ok handler on Ok', async () => {
        const result = ok(42);
        const output = await result.pipeAsync(foldAsync({
            ok: async (value) => `success: ${value}`,
            err: async (error) => `error: ${error}`
        }));
        expect(output).toBe('success: 42');
    });

    it('applies the err handler on Err', async () => {
        const result = err('something went wrong');
        const output = await result.pipeAsync(foldAsync({
            ok: async (value) => `success: ${value}`,
            err: async (error) => `error: ${error}`
        }));
        expect(output).toBe('error: something went wrong');
    });

    it('works with truly async handlers', async () => {
        const result = ok(2);
        const output = await result.pipeAsync(foldAsync({
            ok: async (value) => {
                await Promise.resolve(); // simulate async
                return `async success: ${value * 3}`;
            },
            err: async (error) => `async error: ${error}`
        }));
        expect(output).toBe('async success: 6');
    });
});
