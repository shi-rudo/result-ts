import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { toNullable } from './toNullable';

describe('toNullable', () => {
    it('returns value on Ok', () => {
        expect(toNullable(ok(42))).toBe(42);
    });

    it('returns null on Err', () => {
        expect(toNullable(err('boom'))).toBeNull();
    });
});

