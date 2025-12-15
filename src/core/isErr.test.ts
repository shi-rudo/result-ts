import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { isErr } from './isErr';

describe('isErr', () => {
    it('gibt false für Ok zurück', () => {
        expect(isErr(ok(42))).toBe(false);
    });

    it('gibt true für Err zurück', () => {
        expect(isErr(err('error'))).toBe(true);
    });

    it('funktioniert als Type Guard', () => {
        const result = err('error message');
        if (isErr(result)) {
            expect(result.error).toBe('error message');
        }
    });
});
