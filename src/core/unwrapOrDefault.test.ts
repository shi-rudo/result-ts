import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { unwrapOrDefault } from './unwrapOrDefault';

describe('unwrapOrDefault', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(unwrapOrDefault(ok(42), 0)).toBe(42);
    });

    it('gibt Default bei Err zurück', () => {
        expect(unwrapOrDefault(err('boom'), 99)).toBe(99);
    });
});

