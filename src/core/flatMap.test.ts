import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { flatMap } from './flatMap';

describe('flatMap', () => {
    it('applies function to Ok and flattens the Result', () => {
        const result = ok(2);
        const flatMapped = result.pipe(flatMap((v) => ok(v * 3)));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe(6);
        }
    });

    it('can return Err from map function', () => {
        const result = ok(2);
        const flatMapped = result.pipe(flatMap((v) => v > 5 ? ok(v) : err('too small')));

        expect(flatMapped.isErr()).toBe(true);
        if (flatMapped.isErr()) {
            expect(flatMapped.error).toBe('too small');
        }
    });

    it('keeps Err unchanged', () => {
        const result = err('original error');
        const flatMapped = result.pipe(flatMap((v) => ok(v * 2)));

        expect(flatMapped).toBe(result);
        expect(flatMapped.isErr()).toBe(true);
    });

    it('works with different Result types', () => {
        const result = ok('hello');
        const flatMapped = result.pipe(flatMap((str) => str.length > 3 ? ok(str.toUpperCase()) : err('too short')));

        expect(flatMapped.isOk()).toBe(true);
        if (flatMapped.isOk()) {
            expect(flatMapped.value).toBe('HELLO');
        }
    });

    it('works in pipe chains', () => {
        const result = ok(2).pipe(
            flatMap((v) => ok(v + 1)),      // 3
            flatMap((v) => ok(v * 2)),      // 6
            flatMap((v) => v > 5 ? ok(`${v}!`) : err('too small'))
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('6!');
        }
    });
});
