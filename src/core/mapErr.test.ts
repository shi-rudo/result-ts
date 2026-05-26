import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { InvalidResultStateError } from '../errors';
import { mapErr } from './mapErr';

describe('mapErr', () => {
    it('leaves Ok unchanged', () => {
        const result = ok(42);
        const mapped = result.pipe(mapErr(e => `mapped: ${e}`));
        expect(mapped.isOk()).toBe(true);
        if (mapped.isOk()) {
            expect(mapped.value).toBe(42);
        }
    });

    it('transforms Err value', () => {
        const result = err('original error');
        const mapped = result.pipe(mapErr(e => `mapped: ${e}`));
        expect(mapped.isErr()).toBe(true);
        if (mapped.isErr()) {
            expect(mapped.error).toBe('mapped: original error');
        }
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => mapErr((error: string) => error.toUpperCase())(malformed)).toThrow(InvalidResultStateError);
    });
});
