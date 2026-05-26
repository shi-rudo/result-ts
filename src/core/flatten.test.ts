import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { flatten } from './flatten';

describe('flatten', () => {
    it('flattens nested Ok', () => {
        const nested: Result<Result<number, string>, string> = ok(ok(42));
        expect(flatten(nested)).toEqual(ok(42));
    });

    it('flattens nested Err', () => {
        const nested: Result<Result<number, string>, string> = ok(Result.err('inner error'));
        expect(flatten(nested)).toEqual(Result.err('inner error'));
    });

    it('returns outer Err', () => {
        const nested: Result<Result<number, string>, string> = Result.err('outer error');
        expect(flatten(nested)).toEqual(Result.err('outer error'));
    });

    it('throws for malformed Result values', () => {
        const malformed = {
            isOk: () => false,
            isErr: () => false,
        } as unknown as Result<Result<number, string>, string>;

        expect(() => flatten(malformed)).toThrow(InvalidResultStateError);
    });
});
