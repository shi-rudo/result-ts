import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { contains } from './contains';

describe('contains', () => {
    it('returns true for Ok with matching value', () => {
        expect(contains(ok(42), 42)).toBe(true);
    });

    it('returns false for Ok with different value', () => {
        expect(contains(ok(42), 43)).toBe(false);
    });

    it('returns false for Err', () => {
        expect(contains(Result.err('error'), 42)).toBe(false);
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => contains(malformed, 42)).toThrow(InvalidResultStateError);
    });
});
