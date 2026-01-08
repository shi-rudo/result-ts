import { describe, expect, it } from 'vitest';

import { err, ok } from '../index';
import { unwrapErr } from './unwrapErr';

describe('unwrapErr', () => {
    it('returns the error on Err', () => {
        expect(unwrapErr(err('boom'))).toBe('boom');
    });

    it('throws an error on Ok', () => {
        expect(() => unwrapErr(ok(42))).toThrow('Called unwrapErr() on Ok: 42');
    });
});
