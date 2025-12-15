import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { match } from './match';

describe('match', () => {
    it('wendet ok-Handler bei Ok an', () => {
        const result = ok(42);
        const output = result.pipe(match({
            ok: (value) => `success: ${value}`,
            err: (error) => `error: ${error}`
        }));
        expect(output).toBe('success: 42');
    });

    it('wendet err-Handler bei Err an', () => {
        const result = err('something went wrong');
        const output = result.pipe(match({
            ok: (value) => `success: ${value}`,
            err: (error) => `error: ${error}`
        }));
        expect(output).toBe('error: something went wrong');
    });

    it('funktioniert in Pipe-Ketten', () => {
        const result = ok(2).pipe(
            (r) => r.pipe(match({
                ok: (v) => ok(v * 3),
                err: (e) => err(`failed: ${e}`)
            }))
        );
        if (result.isOk()) {
            expect(result.value).toBe(6);
        }
    });
});
