import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { unwrapErr } from './unwrapErr';

describe('unwrapErr', () => {
    it('gibt Error bei Err zurück', () => {
        expect(unwrapErr(err('boom'))).toBe('boom');
    });

    it('wirft Error bei Ok', () => {
        expect(() => unwrapErr(ok(42))).toThrow('Called unwrapErr() on Ok: 42');
    });
});

