import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { and } from './and';

describe('and', () => {
    it('returns the second Result on Ok', () => {
        expect(and(ok(1), ok(2))).toEqual(ok(2));
        expect(and(ok(1), Result.err('error'))).toEqual(Result.err('error'));
    });

    it('returns the first Err on Err', () => {
        expect(and(Result.err('error1'), ok(2))).toEqual(Result.err('error1'));
        expect(and(Result.err('error1'), Result.err('error2'))).toEqual(Result.err('error1'));
    });
});
