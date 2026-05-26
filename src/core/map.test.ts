import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { InvalidResultStateError } from '../errors';
import { map } from './map';

describe('map', () => {
    it('transforms Ok value', () => {
        const result = ok(2);
        const mapped = result.pipe(map(x => x * 3));
        expect(mapped.isOk()).toBe(true);
        if (mapped.isOk()) {
            expect(mapped.value).toBe(6);
        }
    });

    it('leaves Err unchanged', () => {
        const result = err('error');
        const mapped = result.pipe(map(x => x * 3));
        expect(mapped.isErr()).toBe(true);
        if (mapped.isErr()) {
            expect(mapped.error).toBe('error');
        }
    });

    it('works in pipe chains', () => {
        const result = ok(2).pipe(
            map(x => x + 1),
            map(x => x * 2)
        );
        if (result.isOk()) {
            expect(result.value).toBe(6);
        }
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => map((x: number) => x * 2)(malformed)).toThrow(InvalidResultStateError);
    });
});
