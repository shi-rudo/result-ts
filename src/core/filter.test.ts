import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { filter } from './filter';

describe('filter', () => {
    it('keeps Ok if predicate is true', () => {
        const result = ok(42);
        const filtered = result.pipe(filter((v) => v > 40, () => 'too small'));

        expect(filtered).toBe(result);
        expect(filtered.isOk()).toBe(true);
    });

    it('converts Ok to Err if predicate is false', () => {
        const result = ok(30);
        const filtered = result.pipe(filter((v) => v > 40, () => 'too small'));

        expect(filtered.isErr()).toBe(true);
        if (filtered.isErr()) {
            expect(filtered.error).toBe('too small');
        }
    });

    it('keeps Err unchanged', () => {
        const result = err('original error');
        const filtered = result.pipe(filter((v) => v > 40, () => 'too small'));

        expect(filtered).toBe(result);
        expect(filtered.isErr()).toBe(true);
    });

    it('works with different Error types', () => {
        const result = ok(30);
        const filtered = result.pipe(filter((v) => v > 40, () => ({ code: 400, message: 'too small' })));

        expect(filtered.isErr()).toBe(true);
        if (filtered.isErr()) {
            expect(filtered.error).toEqual({ code: 400, message: 'too small' });
        }
    });

    it('works in pipe chains', () => {
        const result = ok(50).pipe(
            filter((v) => v > 40, () => 'too small'),
            filter((v) => v < 60, () => 'too big')
        );

        expect(result.isOk()).toBe(true);
    });
});
