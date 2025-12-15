import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { unwrapOrThrow } from './unwrapOrThrow';

describe('unwrapOrThrow', () => {
    it('gibt Ok-Wert zurück', () => {
        expect(unwrapOrThrow(ok(123))).toBe(123);
    });

    it('wirft originalen Error', () => {
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
