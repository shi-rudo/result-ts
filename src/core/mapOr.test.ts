import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { mapOr } from './mapOr';

describe('mapOr', () => {
    it('applies function to Ok', () => {
        expect(mapOr(ok(2), 0, x => x * 3)).toBe(6);
    });

    it('returns default for Err', () => {
        expect(mapOr(Result.err('error'), 99, x => x * 3)).toBe(99);
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => mapOr(malformed, 99, value => value * 3)).toThrow(InvalidResultStateError);
    });
});
