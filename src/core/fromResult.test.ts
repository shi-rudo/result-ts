import { describe, expect, it } from 'vitest';

import { ok, err } from './result';
import { fromResult } from './fromResult';

describe('fromResult', () => {
    it('gibt Ok bei erfolgreicher Funktion', () => {
        expect(fromResult(() => 42)).toEqual(ok(42));
    });

    it('gibt Err bei Exception', () => {
        expect(fromResult(() => { throw 'error'; })).toEqual(err('error'));
    });
});