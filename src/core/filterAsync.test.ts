import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { filterAsync } from './filterAsync';

describe('filterAsync', () => {
    it('keeps Ok if async predicate is true', async () => {
        const result = ok(42);
        const filtered = await result.pipeAsync(filterAsync(async (v) => v > 40, async () => 'too small'));

        expect(filtered).toBe(result);
        expect(filtered.isOk()).toBe(true);
    });

    it('converts Ok to Err if async predicate is false', async () => {
        const result = ok(30);
        const filtered = await result.pipeAsync(filterAsync(async (v) => v > 40, async () => 'too small'));

        expect(filtered.isErr()).toBe(true);
        if (filtered.isErr()) {
            expect(filtered.error).toBe('too small');
        }
    });

    it('keeps Err unchanged', async () => {
        const result = err('original error');
        const filtered = await result.pipeAsync(filterAsync(async (v) => v > 40, async () => 'too small'));

        expect(filtered).toBe(result);
        expect(filtered.isErr()).toBe(true);
    });

    it('waits for async predicate', async () => {
        let called = false;
        const result = ok(50);
        const filtered = await result.pipeAsync(filterAsync(async (v) => {
            await Promise.resolve();
            called = true;
            return v > 40;
        }, async () => 'too small'));

        expect(called).toBe(true);
        expect(filtered.isOk()).toBe(true);
    });

    it('waits for async errorFn', async () => {
        let called = false;
        const result = ok(30);
        const filtered = await result.pipeAsync(filterAsync(async (v) => v > 40, async () => {
            await Promise.resolve();
            called = true;
            return 'too small';
        }));

        expect(called).toBe(true);
        expect(filtered.isErr()).toBe(true);
        if (filtered.isErr()) {
            expect(filtered.error).toBe('too small');
        }
    });

    it('works in async pipe chains', async () => {
        const result = await ok(50).pipeAsync(
            filterAsync(async (v) => v > 40, async () => 'too small'),
            filterAsync(async (v) => v < 60, async () => 'too big')
        );

        expect(result.isOk()).toBe(true);
    });
});
