import { describe, expect, it } from 'vitest';

import { err, ok } from '../index';
import { expectErr } from './expectErr';

describe('expectErr', () => {
    it('returns the error on Err', () => {
        expect(expectErr(err('boom'), 'should not throw')).toBe('boom');
    });

    it('throws an error on Ok with a custom message', () => {
        expect(() => expectErr(ok(42), 'expected err')).toThrow('expected err');
    });
});
