import { describe, expect, it } from 'vitest';

import { Result, ok, err } from '../index';
import { fold } from './fold';

describe('fold', () => {
    it('applies the ok handler on Ok', () => {
        const result = ok(42);
        const output = result.pipe(fold({
            ok: (value) => `success: ${value}`,
            err: (error) => `error: ${error}`
        }));
        expect(output).toBe('success: 42');
    });

    it('applies the err handler on Err', () => {
        const result = err('something went wrong');
        const output = result.pipe(fold({
            ok: (value) => `success: ${value}`,
            err: (error) => `error: ${error}`
        }));
        expect(output).toBe('error: something went wrong');
    });

    it('works in pipe chains', () => {
        const result = ok(2).pipe(
            (r) => r.pipe(fold({
                ok: (v) => ok(v * 3),
                err: (e) => err(`failed: ${e}`)
            }))
        );
        if (result.isOk()) {
            expect(result.value).toBe(6);
        }
    });
});
