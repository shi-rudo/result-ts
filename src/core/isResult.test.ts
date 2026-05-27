import { describe, expect, it } from 'vitest';

import { isResult } from './isResult';
import { err, ok } from './result';

const RESULT_BRAND = Symbol.for('@shirudo/result.brand');

describe('isResult', () => {
    it('returns true for Ok and Err', () => {
        expect(isResult(ok(1))).toBe(true);
        expect(isResult(err('boom'))).toBe(true);
    });

    it('brands Ok and Err with a stable non-enumerable symbol', () => {
        const okResult = ok(1) as Record<PropertyKey, unknown>;
        const errResult = err('boom') as Record<PropertyKey, unknown>;

        expect(okResult[RESULT_BRAND]).toBe(true);
        expect(errResult[RESULT_BRAND]).toBe(true);
        expect(Object.getOwnPropertyDescriptor(okResult, RESULT_BRAND)).toMatchObject({ enumerable: false });
        expect(Object.getOwnPropertyDescriptor(errResult, RESULT_BRAND)).toMatchObject({ enumerable: false });
    });

    it('accepts branded Result-like values with valid payload shape', () => {
        const crossCopyOk = {
            [RESULT_BRAND]: true,
            _tag: 'Ok',
            value: 1,
            isOk: () => true,
            isErr: () => false,
        };
        const crossCopyErr = {
            [RESULT_BRAND]: true,
            _tag: 'Err',
            error: 'boom',
            isOk: () => false,
            isErr: () => true,
        };

        expect(isResult(crossCopyOk)).toBe(true);
        expect(isResult(crossCopyErr)).toBe(true);
    });

    it('returns false for non-Result values', () => {
        expect(isResult(null)).toBe(false);
        expect(isResult(undefined)).toBe(false);
        expect(isResult({})).toBe(false);
        expect(isResult({ isOk: () => true })).toBe(false);
        expect(isResult({ isOk: () => true, isErr: 'nope' })).toBe(false);
        expect(isResult({ isOk: () => true, isErr: () => false, value: 1 })).toBe(false);
        expect(isResult({ _tag: 'Ok', value: 1, isOk: () => true, isErr: () => false })).toBe(false);
        expect(isResult({ [RESULT_BRAND]: true, _tag: 'Ok', error: 'wrong', isOk: () => true, isErr: () => false })).toBe(false);
        expect(isResult({ [RESULT_BRAND]: true, _tag: 'Err', value: 1, isOk: () => false, isErr: () => true })).toBe(false);
        expect(isResult({ [RESULT_BRAND]: true, _tag: 'Invalid', value: 1, isOk: () => false, isErr: () => false })).toBe(false);
    });
});
