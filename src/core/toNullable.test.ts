import { describe, expect, it } from 'vitest';

import { InvalidResultStateError } from '../errors';
import { err, ok, type Result } from './result';
import { toNullable } from './toNullable';

describe('toNullable', () => {
    it('returns value on Ok', () => {
        expect(toNullable(ok(42))).toBe(42);
    });

    it('returns null on Err', () => {
        expect(toNullable(err('boom'))).toBeNull();
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => toNullable(malformed)).toThrow(InvalidResultStateError);
    });
});
