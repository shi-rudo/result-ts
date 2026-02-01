import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { or } from './or';

describe('or', () => {
    it('returns first Ok if Ok', () => {
        expect(or(ok(1), ok(2))).toEqual(ok(1));
        expect(or(ok(1), Result.err('error'))).toEqual(ok(1));
    });

    it('returns second Result if Err', () => {
        expect(or(Result.err('error1'), ok(2))).toEqual(ok(2));
        expect(or(Result.err('error1'), Result.err('error2'))).toEqual(Result.err('error2'));
    });
});