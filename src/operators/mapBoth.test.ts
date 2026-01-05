import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { bimap, mapBoth } from './mapBoth';

describe('mapBoth / bimap', () => {
    it('transforms Ok and Err', () => {
        const okResult = ok<number, string>(2).pipe(mapBoth(x => x + 1, e => e.length));
        expect(okResult.isOk()).toBe(true);
        if (okResult.isOk()) {
            const value: number = okResult.value;
            expect(value).toBe(3);
        }

        const errResult = Result.err<string, number>('boom').pipe(mapBoth(x => x + 1, e => e.toUpperCase()));
        expect(errResult.isErr()).toBe(true);
        if (errResult.isErr()) {
            const error: string = errResult.error;
            expect(error).toBe('BOOM');
        }
    });

    it('bimap is an alias for mapBoth', () => {
        const result = ok<number, string>(2).pipe(bimap(x => x * 2, e => e));
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(4);
        }
    });
});
