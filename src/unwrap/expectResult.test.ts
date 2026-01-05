import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { expectResult } from './expectResult';

describe('expectResult', () => {
    it('returns the value on Ok', () => {
        expect(expectResult(ok(42), 'custom message')).toBe(42);
    });

    it('throws a custom error on Err', () => {
        expect(() => expectResult(Result.err('error'), 'custom message')).toThrow('custom message');
    });
});
