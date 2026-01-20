import { describe, expect, it, vi } from 'vitest';

import { tryMap } from './tryMap';
import { err, ok } from './result';

describe('tryMap', () => {
    it('maps Ok value', () => {
        const project = vi.fn((value: number) => value + 1);
        const result = ok(1).pipe(tryMap(project));

        expect(project).toHaveBeenCalledWith(1);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(2);
        }
    });

    it('converts throw into Err using errorMapper', () => {
        const result = ok(1).pipe(
            tryMap(
                () => {
                    throw new Error('boom');
                },
                (error) => `mapped:${(error as Error).message}`
            )
        );

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('mapped:boom');
        }
    });

    it('skips project when source is Err', () => {
        const project = vi.fn(() => 123);
        const source = err('original error');

        const result = source.pipe(tryMap(project));

        expect(result).toBe(source);
        expect(project).not.toHaveBeenCalled();
    });
});
