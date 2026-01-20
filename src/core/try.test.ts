import { describe, expect, it } from 'vitest';

import { tryFn } from './try';

describe('tryFn', () => {
    it('returns Ok when function does not throw', () => {
        const result = tryFn(() => 42);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('returns Err when function throws', () => {
        const result = tryFn(() => {
            throw new Error('boom');
        });

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('boom');
        }
    });
});
