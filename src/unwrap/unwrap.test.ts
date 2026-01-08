import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { unwrap } from './unwrap';

describe('unwrap', () => {
    it('returns the value on Ok', () => {
        expect(unwrap(ok(42))).toBe(42);
    });

    it('throws an error on Err', () => {
        expect(() => unwrap(Result.err('error'))).toThrow('Called unwrap() on Err: error');
    });
});
