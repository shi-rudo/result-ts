import { describe, expect, it } from 'vitest';

import { Result, ok, err, okIf } from '../index';
import { flatMapAsync } from './flatMapAsync';

describe('flatMapAsync', () => {
    it('applies the async function to Ok and flattens the Result', async () => {
        const result = ok(2);
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => ok(v * 3)));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe(6);
        }
    });

    it('can return async Err from the map function', async () => {
        const result = ok(2);
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => {
            await Promise.resolve();
            return okIf(v > 5, v, 'too small');
        }));

        expect(flatMapped.isErr()).toBe(true);
        if (flatMapped.isErr()) {
            expect(flatMapped.error).toBe('too small');
        }
    });

    it('keeps Err unchanged', async () => {
        const result = err('original error');
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => ok(v * 2)));

        expect(flatMapped).toBe(result);
        expect(flatMapped.isErr()).toBe(true);
    });

    it('waits for async functions', async () => {
        let processed = false;
        const result = ok(3);
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => {
            await Promise.resolve();
            processed = true;
            return ok(v * 2); // 6
        }));

        expect(processed).toBe(true);
        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe(6);
        }
    });

    it('works with different Result types', async () => {
        const result = ok('hello');
        const flatMapped = await result.pipeAsync(flatMapAsync(async (str) => {
            await Promise.resolve();
            return okIf(str.length > 3, str.toUpperCase(), 'too short');
        }));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe('HELLO');
        }
    });

    it('works in async pipe chains', async () => {
        const result = await ok(2).pipeAsync(
            flatMapAsync(async (v) => ok(v + 1)),      // 3
            flatMapAsync(async (v) => ok(v * 2)),      // 6
            flatMapAsync(async (v) => okIf(v > 5, `${v}!`, 'too small'))
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('6!');
        }
    });
});
