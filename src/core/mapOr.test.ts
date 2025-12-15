import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { mapOr } from './mapOr';

describe('mapOr', () => {
    it('wendet Funktion bei Ok an', () => {
        expect(mapOr(ok(2), 0, x => x * 3)).toBe(6);
    });

    it('gibt Default bei Err zurück', () => {
        expect(mapOr(Result.err('error'), 99, x => x * 3)).toBe(99);
    });
});