import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { flatMapAsync } from './flatMapAsync';

describe('flatMapAsync', () => {
    it('wendet async Funktion auf Ok an und flacht das Result ab', async () => {
        const result = ok(2);
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => ok(v * 3)));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe(6);
        }
    });

    it('kann async Err aus der map-Funktion zurückgeben', async () => {
        const result = ok(2);
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => {
            await Promise.resolve();
            return v > 5 ? ok(v) : err('too small');
        }));

        expect(flatMapped.isErr()).toBe(true);
        if (flatMapped.isErr()) {
            expect(flatMapped.error).toBe('too small');
        }
    });

    it('behält Err unverändert bei', async () => {
        const result = err('original error');
        const flatMapped = await result.pipeAsync(flatMapAsync(async (v) => ok(v * 2)));

        expect(flatMapped).toBe(result);
        expect(flatMapped.isErr()).toBe(true);
    });

    it('wartet auf async Funktionen', async () => {
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

    it('funktioniert mit verschiedenen Result-Typen', async () => {
        const result = ok('hello');
        const flatMapped = await result.pipeAsync(flatMapAsync(async (str) => {
            await Promise.resolve();
            return str.length > 3 ? ok(str.toUpperCase()) : err('too short');
        }));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe('HELLO');
        }
    });

    it('funktioniert in async Pipe-Ketten', async () => {
        const result = await ok(2).pipeAsync(
            flatMapAsync(async (v) => ok(v + 1)),      // 3
            flatMapAsync(async (v) => ok(v * 2)),      // 6
            flatMapAsync(async (v) => v > 5 ? ok(`${v}!`) : err('too small'))
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('6!');
        }
    });
});
