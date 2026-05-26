import { describe, expect, it } from 'vitest';

import { InvalidResultStateError } from '../errors';
import { err, ok, type Result } from './result';
import { unwrapOr } from './unwrapOr';

describe('unwrapOr', () => {
    it('returns value on Ok', () => {
        expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('returns default on Err', () => {
        expect(unwrapOr(err('boom'), 99)).toBe(99);
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => unwrapOr(malformed, 99)).toThrow(InvalidResultStateError);
    });
});
