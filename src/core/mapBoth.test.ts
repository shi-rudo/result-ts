import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { bimap, mapBoth } from './mapBoth';

describe('mapBoth / bimap', () => {
    it('transforms Ok and Err', () => {
        const okResult = ok(2).pipe(mapBoth(x => x + 1, e => e.length));
        expect(okResult.isOk()).toBe(true);
        if (okResult.isOk()) {
            const value: number = okResult.value;
            expect(value).toBe(3);
        }

        const errResult = Result.err('boom').pipe(mapBoth(x => x + 1, e => e.toUpperCase()));
        expect(errResult.isErr()).toBe(true);
        if (errResult.isErr()) {
            const error: string = errResult.error;
            expect(error).toBe('BOOM');
        }
    });

    it('bimap is alias for mapBoth', () => {
        const result = ok(2).pipe(bimap(x => x * 2, e => e));
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(4);
        }
    });
});

