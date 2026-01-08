import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { unwrapOrThrow } from './unwrapOrThrow';

describe('unwrapOrThrow', () => {
    it('returns the Ok value', () => {
        expect(unwrapOrThrow(ok(123))).toBe(123);
    });

    it('throws the original error', () => {
        const original = new Error('boom');
        const result = Result.err(original);

        try {
            unwrapOrThrow(result);
            throw new Error('expected to throw');
        } catch (caught) {
            expect(caught).toBe(original);
        }
    });
});
