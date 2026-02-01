import { describe, expect, it } from 'vitest';

import { ok, err } from './result';
import { fromResult } from './fromResult';

describe('fromResult', () => {
    it('returns Ok for successful function', () => {
        expect(fromResult(() => 42)).toEqual(ok(42));
    });

    it('returns Err for exception', () => {
        expect(fromResult(() => { throw 'error'; })).toEqual(err('error'));
    });
});