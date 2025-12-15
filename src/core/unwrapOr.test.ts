import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { unwrapOr } from './unwrapOr';

describe('unwrapOr', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('gibt Default bei Err zurück', () => {
        expect(unwrapOr(err('boom'), 99)).toBe(99);
    });
});

