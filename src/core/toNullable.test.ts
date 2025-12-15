import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { toNullable } from './toNullable';

describe('toNullable', () => {
    it('gibt Wert bei Ok zurück', () => {
        expect(toNullable(ok(42))).toBe(42);
    });

    it('gibt null bei Err zurück', () => {
        expect(toNullable(err('boom'))).toBeNull();
    });
});

