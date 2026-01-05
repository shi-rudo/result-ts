import { describe, expect, it } from 'vitest';

import { Result, ok } from '../index';
import { recover, recoverWith } from './recover';

describe('recover / recoverWith', () => {
    it('recover replaces Err with Ok(defaultValue)', () => {
        const a = ok(1).pipe(recover(9));
        const _typeA: Result<number, never> = a;

        expect(a.isOk()).toBe(true);
        if (a.isOk()) {
            expect(a.value).toBe(1);
        }

        const b = Result.err('oops').pipe(recover(9));
        const _typeB: Result<number, never> = b;

        expect(b.isOk()).toBe(true);
        if (b.isOk()) {
            expect(b.value).toBe(9);
        }
    });

    it('recoverWith computes the Ok value from the error', () => {
        const a = ok(1).pipe(recoverWith(() => 9));
        expect(a.isOk()).toBe(true);
        if (a.isOk()) {
            const value: number = a.value;
            expect(value).toBe(1);
        }

        const b = Result.err('oops').pipe(recoverWith(e => e.length));
        expect(b.isOk()).toBe(true);
        if (b.isOk()) {
            const value: number = b.value;
            expect(value).toBe(4);
        }
    });
});
