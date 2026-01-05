import { describe, expect, it } from 'vitest';

import { ok, err } from '../index';
import { tryFn } from './try';

describe('tryFn', () => {
    it('returns Ok for a successful function', () => {
        expect(tryFn(() => 42)).toEqual(ok(42));
    });

    it('returns Err on exception', () => {
        expect(tryFn(() => { throw 'error'; })).toEqual(err('error'));
    });
});
