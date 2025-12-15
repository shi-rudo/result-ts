import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { unwrap } from './unwrap';

describe('unwrap', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(unwrap(ok(42))).toBe(42);
    });

    it('wirft Error bei Err', () => {
        expect(() => unwrap(Result.err('error'))).toThrow('Called unwrap() on Err: error');
    });
});