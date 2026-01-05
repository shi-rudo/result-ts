import { describe, expect, it } from 'vitest';

import { err, ok } from '../index';
import { containsErr } from './containsErr';

describe('containsErr', () => {
    it('returns true for Err with matching error', () => {
        expect(containsErr(err('boom'), 'boom')).toBe(true);
    });

    it('returns false for Err with a different error', () => {
        expect(containsErr(err('boom'), 'nope')).toBe(false);
    });

    it('returns false for Ok', () => {
        expect(containsErr(ok(42), 'boom')).toBe(false);
    });
});
