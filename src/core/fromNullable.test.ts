import { describe, expect, it } from 'vitest';

import { fromNullable } from './fromNullable';

describe('fromNullable', () => {
    it('returns Ok for non-null values', () => {
        const result = fromNullable('x' as string | null, 'missing');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: string = result.value;
            expect(value).toBe('x');
        }
    });

    it('returns Err for null/undefined', () => {
        const a = fromNullable(null as string | null, 'missing');
        expect(a.isErr()).toBe(true);
        if (a.isErr()) expect(a.error).toBe('missing');

        const b = fromNullable(undefined as string | undefined, 'missing');
        expect(b.isErr()).toBe(true);
        if (b.isErr()) expect(b.error).toBe('missing');
    });
});

