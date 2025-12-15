import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { flatten } from './flatten';

describe('flatten', () => {
    it('flacht nested Ok ab', () => {
        const nested: Result<Result<number, string>, string> = ok(ok(42));
        expect(flatten(nested)).toEqual(ok(42));
    });

    it('flacht nested Err ab', () => {
        const nested: Result<Result<number, string>, string> = ok(Result.err('inner error'));
        expect(flatten(nested)).toEqual(Result.err('inner error'));
    });

    it('gibt outer Err zurück', () => {
        const nested: Result<Result<number, string>, string> = Result.err('outer error');
        expect(flatten(nested)).toEqual(Result.err('outer error'));
    });
});