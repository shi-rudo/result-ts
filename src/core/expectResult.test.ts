import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { expectResult } from './expectResult';

describe('expectResult', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(expectResult(ok(42), 'custom message')).toBe(42);
    });

    it('wirft custom Error bei Err', () => {
        expect(() => expectResult(Result.err('error'), 'custom message')).toThrow('custom message');
    });
});