import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { expectErr } from './expectErr';

describe('expectErr', () => {
    it('gibt Error bei Err zurück', () => {
        expect(expectErr(err('boom'), 'should not throw')).toBe('boom');
    });

    it('wirft Error bei Ok mit custom Nachricht', () => {
        expect(() => expectErr(ok(42), 'expected err')).toThrow('expected err');
    });
});

