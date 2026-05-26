import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { and } from './and';

describe('and', () => {
    it('returns second Result if Ok', () => {
        expect(and(ok(1), ok(2))).toEqual(ok(2));
        expect(and(ok(1), Result.err('error'))).toEqual(Result.err('error'));
    });

    it('returns first Err if Err', () => {
        expect(and(Result.err('error1'), ok(2))).toEqual(Result.err('error1'));
        expect(and(Result.err('error1'), Result.err('error2'))).toEqual(Result.err('error1'));
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<number, string>;

        expect(() => and(malformed, ok(2))).toThrow(InvalidResultStateError);
    });
});
