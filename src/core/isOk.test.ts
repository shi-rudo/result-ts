import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { isOk } from './isOk';

describe('isOk', () => {
    it('gibt true für Ok zurück', () => {
        expect(isOk(ok(42))).toBe(true);
    });

    it('gibt false für Err zurück', () => {
        expect(isOk(err('error'))).toBe(false);
    });

    it('funktioniert als Type Guard', () => {
        const result = ok(42);
        if (isOk(result)) {
            expect(result.value).toBe(42);
        }
    });
});
