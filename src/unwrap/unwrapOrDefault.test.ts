import { describe, expect, it } from 'vitest';

import { err, ok } from '../index';
import { unwrapOrDefault } from './unwrapOrDefault';

describe('unwrapOrDefault', () => {
    it('returns the value on Ok', () => {
        expect(unwrapOrDefault(ok(42), 0)).toBe(42);
    });

    it('returns the default on Err', () => {
        expect(unwrapOrDefault(err('boom'), 99)).toBe(99);
    });
});
