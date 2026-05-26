import { describe, expect, it } from 'vitest';

import { InvalidResultStateError } from '../errors';
import { err, ok, type Result } from './result';
import { unwrapOrDefault } from './unwrapOrDefault';

describe('unwrapOrDefault', () => {
    it('returns value on Ok', () => {
        expect(unwrapOrDefault(ok(42), 0)).toBe(42);
    });

    it('returns default on Err', () => {
        expect(unwrapOrDefault(err('boom'), 99)).toBe(99);
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => unwrapOrDefault(malformed, 99)).toThrow(InvalidResultStateError);
    });
});
