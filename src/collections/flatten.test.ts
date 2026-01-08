import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
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

    it('returns the outer Err', () => {
        const nested: Result<Result<number, string>, string> = Result.err('outer error');
        expect(flatten(nested)).toEqual(Result.err('outer error'));
    });
});
