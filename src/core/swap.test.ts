import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { swap } from './swap';

describe('swap', () => {
    it('swaps Ok and Err', () => {
        const a = swap(ok(42));
        expect(a.isErr()).toBe(true);
        if (a.isErr()) {
            const error: number = a.error;
            expect(error).toBe(42);
        }

        const b = swap(Result.err('nope'));
        expect(b.isOk()).toBe(true);
        if (b.isOk()) {
            const value: string = b.value;
            expect(value).toBe('nope');
        }
    });
});

